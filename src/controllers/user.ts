import { Request, Response, NextFunction } from 'express';
import { registerBrotherService, registerSisterService, loginBrotherService, getUser, getSistersByBrotherId, deleteSisterAccountService, registerUserService, loginUserService } from '../services/user.js';
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

        const user = await registerBrotherService({
            phoneNumber,
            name,
            password,
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
        const user = await registerSisterService({
            phoneNumber,
            name,
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
        const { phoneNumber } = req.body;
        const countryCode = req.body.countryCode || "+91";

        if (!phoneNumber) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const user = await User.findOne({ phoneNumber, countryCode });
        
        if (!user) {
            throw new ApiError({ statusCode: 404, message: "User not found" });
        }

        const otp = generateAlphanumericOTP();

        // Save in redis with 5 mins expiry (300s)
        await storeValueRedis({
            prefix: "OTP",
            key: `${countryCode}${phoneNumber}`,
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

export const loginByOtp = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, otp } = req.body;
        const countryCode = req.body.countryCode || "+91";

        if (!phoneNumber || !otp) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const user = await User.findOne({ phoneNumber, countryCode });

        if (!user) {
            throw new ApiError({ statusCode: 404, message: "User not found" });
        }

        // Validate OTP from redis
        const storedOtpResult = await getValueRedis({ prefix: "OTP", key: `${countryCode}${phoneNumber}` });
        
        if (!storedOtpResult.value || storedOtpResult.value !== otp) {
            throw new ApiError({ statusCode: 400, message: "Invalid or expired OTP" });
        }

        // Set access token
        setAccessTokenCookie(res, { userId: String(user._id), role: user.role as UserRole });

        // Optional: delete the OTP from redis after successful login to prevent reuse
        await deleteValueRedis({ prefix: "OTP", key: `${countryCode}${phoneNumber}` });

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: user
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

export const getSistersAccounts = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        if (!brotherId) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized" });
        }
        
        if (req.user?.role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can fetch these accounts" });
        }

        const sisters = await getSistersByBrotherId(brotherId);

        res.status(200).json({
            success: true,
            message: "Sisters accounts fetched successfully",
            data: sisters
        });

    } catch (error) {
        next(error);
    }
};

export const deleteSisterAccount = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const sisterId = req.params.sisterId as string;

        if (!brotherId) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized" });
        }

        if (req.user?.role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can delete sister accounts" });
        }

        if (!sisterId) {
            throw new ApiError({ statusCode: 400, message: "Sister ID is required" });
        }

        const sis = await deleteSisterAccountService(brotherId, sisterId);

        res.status(200).json({
            success: true,
            message: "Sister account deleted successfully",
            data: sis
        });

    } catch (error) {
        next(error);
    }
};

export const registerUser = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, name, password, role} = req.body;
        const countryCode = req.body.countryCode || "+91";

        if (!phoneNumber || !name || !role) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        if (!Object.values(UserRole).includes(role)) {
            throw new ApiError({ statusCode: 400, message: "Invalid role" });
        }

        const user = await registerUserService({
            phoneNumber,
            countryCode,
            name,
            password,
            role
        });

        setAccessTokenCookie(res, { userId: user._id, role: user.role as UserRole });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, password, role } = req.body;
        const countryCode = req.body.countryCode || "+91";

        if (!phoneNumber || !role || !password) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        if (!Object.values(UserRole).includes(role)) {
            throw new ApiError({ statusCode: 400, message: "Invalid role" });
        }

        const user = await loginUserService({
            phoneNumber,
            countryCode,
            password,
            role
        });

        setAccessTokenCookie(res, { userId: user._id, role: user.role as UserRole });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};
