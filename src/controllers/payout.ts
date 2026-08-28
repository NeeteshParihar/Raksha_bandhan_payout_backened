import { Request, Response, NextFunction } from 'express';
import { IapiRequest } from '../utils/types.js';
import { ApiError } from '../utils/error_handling.js';
import { UserRole, User } from '../models/users.js';
import { QuizStatus } from '../models/quiz.js';
import { getQuizService, getQuizOwners } from '../services/quiz.js';
import { Coupon, CouponStatus } from '../models/coupon.js';
import { getAllAttemptsOfQuiz } from '../services/attempt.js';
import { createPayoutService, getQuizPayoutService, updatePayoutStatusService, getPayoutsByBrotherIdService } from '../services/payout.js';
import { sendSMS } from '../services/sms.js';
import { PayoutStatus } from '../models/payout.js';

export const createPayout = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        // coupon is optional here
        const { upiId, couponCode } = req.body;
        const { quizId } = req.params as any;
        const sisterId = req.user?.userId;
        const role = req.user?.role;

        // 1. Validate inputs and role
        if (role !== UserRole.SISTER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only sisters can request a payout" });
        }

        if (!sisterId || !quizId || !upiId) {
            throw new ApiError({ statusCode: 400, message: "Missing required fields (quizId, upiId)" });
        }

        // 2. Fetch the quiz and validate
        // getQuizService checks if the user (sisterId) is authorized to access the quiz
        const quiz = await getQuizService(quizId, sisterId);
        
        if (quiz.status !== QuizStatus.COMPLETED) {
            throw new ApiError({ statusCode: 400, message: "Quiz is not completed yet" });
        }
        if( String(sisterId) !==  String(quiz.sisterId) ) {
            throw new ApiError({ statusCode: 403, message: "Action forbidden!"});
        }

        // 3. Fetch coupon and validate if provided
        let couponAmount = 0;
        let couponDoc = null;
        if (couponCode) {
            couponDoc = await Coupon.findOne({ couponCode, sisterId });
            if (!couponDoc) {
                throw new ApiError({ statusCode: 404, message: "Invalid coupon code or does not belong to you" });
            }
            if (couponDoc.status !== CouponStatus.UNUSED) {
                throw new ApiError({ statusCode: 400, message: "Coupon has already been used" });
            }
            if (couponDoc.expiry && new Date(couponDoc.expiry) < new Date()) {
                throw new ApiError({ statusCode: 400, message: "Coupon has expired" });
            }
            // Add extra check to make sure the coupon is from the same brother who created the quiz
            if (String(couponDoc.brotherId) !== String(quiz.brother._id!)) {
                 throw new ApiError({ statusCode: 400, message: "This coupon is not valid for this quiz (belongs to a different brother)" });
            }
            couponAmount = couponDoc.amount;
        }

        // 4. Calculate quizAmount from attempts
        const attempts = await getAllAttemptsOfQuiz(quizId);
        const quizAmount = attempts.totalAmountEarned || 0;
        const totalAmount = quizAmount + couponAmount;

        if (totalAmount <= 0) {
            throw new ApiError({ statusCode: 400, message: "Total payout amount must be greater than 0" });
        }

        const brotherId = String(quiz.brother?._id || quiz.brotherId);

        // 5. Prepare data and create payout
        const payout = await createPayoutService({
            brotherId,
            sisterId,
            quizId,
            upiId,
            totalAmount,
            couponAmount,
            quizAmount,
            couponCode: couponCode || undefined
        });

        // 6. Mark coupon as used
        if (couponDoc) {
            couponDoc.status = CouponStatus.APPLIED;
            await couponDoc.save();
        }

        // 7. Get brother and sister details for the message
        const brother = await User.findById(brotherId);
        const sister = await User.findById(sisterId);

        if (!brother || !sister) {
            throw new ApiError({ statusCode: 404, message: "Brother or Sister details not found" });
        }

        // 8. Form the UPI redirect link (clickable HTTP url)
        // Format: http(s)://domain/api/payouts/pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const clickableLink = encodeURI(`${baseUrl}/api/payouts/pay?pa=${upiId}&pn=${sister.name}&am=${totalAmount}`);

        // 9. Send message to brother
        const message = `Hi ${brother.name}, your sister ${sister.name} has completed the quiz "${quiz.title}" and requested a Rakhi payout of Rs. ${totalAmount}.\n\nPlease click on this link to pay: ${clickableLink}`;
        
        await sendSMS({
            phoneNumber:`${brother.countryCode}${brother.phoneNumber}`,
            message
        });

        res.status(201).json({
            success: true,
            message: "Payout created and request sent to brother successfully",
            data: payout
        });

    } catch (error) {
        next(error);
    }
};

export const redirectUPI = (req: Request, res: Response) => {
    const { pa, pn, am } = req.query ;
    
    if (!pa || !pn || !am) {
        return res.status(400).send("Invalid UPI link parameters");
    }

    // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR
    const upiLink = encodeURI(`upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`);
    
    // Send a 302 redirect. Mobile browsers will interpret this and try to open a UPI app.
    res.redirect(upiLink);
};

export const getQuizPayout = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const quizId = req.params.quizId as string;
        const status = req.query.status as PayoutStatus;
        const userId = String(req.user?.userId!);
        
        if (!quizId) {
            throw new ApiError({ statusCode: 400, message: "Quiz ID is required" });
        }

        const owners = await getQuizOwners(quizId);
        if (userId !== owners.brotherId && userId !== owners.sisterId) {
            throw new ApiError({ statusCode: 403, message: "Unauthorized access to this payout" });
        }

        const payout = await getQuizPayoutService(quizId, status);
        
        if (!payout) {
            throw new ApiError({ statusCode: 404, message: "No payout found for this quiz" });
        }

        res.status(200).json({
            success: true,
            data: payout
        });
    } catch (error) {
        next(error);
    }
};

export const updatePayoutStatus = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const payoutId = req.params.payoutId as string;
        const { status } = req.body;
        const userId = String(req.user?.userId!);

        if (!payoutId || !status) {
            throw new ApiError({ statusCode: 400, message: "Payout ID and status are required" });
        }

        if( status !== PayoutStatus.SUCCESS) {
            throw new ApiError({
                statusCode: 400, message: "This action is not supported, you can only mark a payout as paid or success"
            })
        }

        const payout = await updatePayoutStatusService(userId, payoutId, status);

        res.status(200).json({
            success: true,
            message: "Payout status updated successfully",
            data: payout
        });
    } catch (error) {
        next(error);
    }
};

export const getPayoutsByBrother = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const userId = String(req.user?.userId!);
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can access this resource" });
        }

        const payouts = await getPayoutsByBrotherIdService(userId);

        res.status(200).json({
            success: true,
            data: payouts
        });
    } catch (error) {
        next(error);
    }
};
