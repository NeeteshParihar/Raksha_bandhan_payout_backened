import { Response, NextFunction } from 'express';
import { IapiRequest } from '../utils/types.js';
import { ApiError } from '../utils/error_handling.js';
import { createCouponService, getCouponService, getSisterCouponService, deleteCouponService, editCouponService, getCouponByCouponCodeService } from '../services/coupon.js';
import { UserRole } from '../models/users.js';

export const createCoupon = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { sisterId, amount, expiry } = req.body;

        // Ensure the requester is a logged-in brother
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can create coupons" });
        }

        if (!brotherId || !sisterId || amount === undefined) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const newCoupon = await createCouponService({
            brotherId: String(brotherId),
            sisterId,
            amount: Number(amount),
            expiry: expiry ? new Date(expiry) : undefined
        });

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: newCoupon
        });
    } catch (error) {
        next(error);
    }
};

export const getCoupon = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can view their coupons" });
        }

        if (!brotherId) {
            throw new ApiError({ statusCode: 400, message: "missing brotherId" });
        }

        const coupons = await getCouponService(String(brotherId));

        res.status(200).json({
            success: true,
            message: "Coupons fetched successfully",
            data: coupons
        });
    } catch (error) {
        next(error);
    }
};

export const getSisterCoupon = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const role = req.user?.role;
        const { sisterId } = req.params;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can view their coupons" });
        }

        if (!brotherId || !sisterId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const coupons = await getSisterCouponService(String(brotherId), sisterId as string);

        res.status(200).json({
            success: true,
            message: "Sister's coupons fetched successfully",
            data: coupons
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCoupon = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const role = req.user?.role;
        const { couponId } = req.params;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can delete coupons" });
        }

        if (!brotherId || !couponId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        await deleteCouponService(couponId as string, String(brotherId));

        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const editCoupon = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const role = req.user?.role;
        const { couponId } = req.params;
        const { amount, expiry } = req.body;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can edit coupons" });
        }

        if (!brotherId || !couponId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (brotherId or couponId)" });
        }

        if( amount === undefined && expiry === undefined  ) throw new ApiError({ statusCode: 400, message: "Atleast one field is required!"});

        const updatedCoupon = await editCouponService({
            brotherId: String(brotherId),
            couponId: couponId as string,
            amount: amount,
            expiry: expiry as Date | null  
        });

        res.status(200).json({
            success: true,
            message: "Coupon updated successfully",
            data: updatedCoupon
        });
    } catch (error) {
        next(error);
    }
};

export const getCouponByCouponCode = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const couponCode = req.params.couponCode as string;

        if (!userId || !couponCode) {
            throw new ApiError({ statusCode: 400, message: "missing required fields" });
        }

        const coupon = await getCouponByCouponCodeService(couponCode, String(userId));

        res.status(200).json({
            success: true,
            message: "Coupon fetched successfully",
            data: coupon
        });
    } catch (error) {
        next(error);
    }
};
