import { Request, Response, NextFunction } from 'express';
import { registerUserService, loginBrotherService, getUser } from '../services/user.js';
import { UserRole, User } from '../models/users.js';
import { setAccessTokenCookie } from '../utils/jwt.js';
import { ApiError } from '../utils/error_handling.js';
import { IapiRequest } from '../utils/types.js';
import { generateAlphanumericOTP } from '../utils/crypto.js';
import { storeValueRedis, getValueRedis, deleteValueRedis } from '../services/redis.js';
import { sendSMS } from '../services/sms.js';

export const registerBrother = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, name, password } = req.body;

        if (!phoneNumber || !name || !password) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const user = await registerUserService({
            phoneNumber,
            name,
            password,
            role: UserRole.BROTHER,
        });

        // Automatically log the brother in by setting the JWT cookie
        setAccessTokenCookie(res, { userId: user._id, role: user.role });

        res.status(201).json({
            success: true,
            message: "Brother registered successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};


export const loginBrother = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, password } = req.body;
        const countryCode = req.body.countryCode || "+91";

        if (!phoneNumber || !password) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const user = await loginBrotherService({
            phoneNumber,
            countryCode,
            password
        });

        // Set the JWT cookie upon successful login
        setAccessTokenCookie(res, { userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: "Brother logged in successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};


export const registerSister = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {

        const { phoneNumber, name } = req.body;
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER)
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can perform this action" });

        if (!phoneNumber || !name || !brotherId)
            throw new ApiError({ statusCode: 400, message: "missing required fields" });


        // A sister is created by the brother, no password is required initially
        const user = await registerUserService({
            phoneNumber,
            name,
            role: UserRole.SISTER,
            brotherId,
        });

        res.status(201).json({
            success: true,
            message: "Sister registered successfully",
            data: user,
        });

    } catch (error) {
        next(error);
    }
};

export const getOtp = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { sisterId } = req.params;

        if (!sisterId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const sister = await User.findById(sisterId);

        if (!sister) {
            throw new ApiError({ statusCode: 404, message: "Sister not found" });
        }

        if (sister.role !== UserRole.SISTER) {
             throw new ApiError({ statusCode: 400, message: "User is not a sister" });
        }

        const countryCode = sister.countryCode || "+91";
        const phoneNumber = sister.phoneNumber;

        const otp = generateAlphanumericOTP();

        // Save in redis with 5 mins expiry (300s)
        await storeValueRedis({
            prefix: "OTP",
            key: sisterId as string,
            value: otp,
            ttl: 300
        });

        const message = `Hi! 🎊 OTP for your rakshabhandhan quiz is ${otp}. It is valid for 5 minutes. Hurry up and Get your rakhi money! 🎁💸✨`;

        await sendSMS({
            phoneNumber: `${countryCode}${phoneNumber}`,
            message: message
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        next(error);
    }
};

export const loginSister = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { sisterId, otp } = req.body;

        if (!sisterId || !otp) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const sister = await User.findById(sisterId);

        if (!sister) {
            throw new ApiError({ statusCode: 404, message: "Sister not found" });
        }

        if (sister.role !== UserRole.SISTER) {
             throw new ApiError({ statusCode: 400, message: "User is not a sister" });
        }

        // Validate OTP from redis
        const storedOtpResult = await getValueRedis({ prefix: "OTP", key: sisterId as string });
        
        if (!storedOtpResult.value || storedOtpResult.value !== otp) {
            throw new ApiError({ statusCode: 400, message: "Invalid or expired OTP" });
        }

        // Set access token
        setAccessTokenCookie(res, { userId: String(sister._id), role: sister.role });

        // Optional: delete the OTP from redis after successful login to prevent reuse
        await deleteValueRedis({ prefix: "OTP", key: sisterId as string });

        res.status(200).json({
            success: true,
            message: "Sister logged in successfully",
            data: sister
        });

    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized" });
        }

        const user = await getUser(userId, ['-password']);

        if (!user) {
            throw new ApiError({ statusCode: 404, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};
