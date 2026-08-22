import { Coupon } from '../models/coupon.js';
import { ApiError } from '../utils/error_handling.js';
import { generateCouponCode } from '../utils/coupon.js';
import { checkIsSister, getUser } from './user.js';

interface ICreateCouponParams {
    brotherId: string;
    sisterId: string;
    amount: number;
    expiry?: Date;
}

export const createCouponService = async ({ brotherId, sisterId, amount, expiry }: ICreateCouponParams) => {
    // Check if the sister exists and has the correct role
    const isSister = await checkIsSister(sisterId);
    if(!isSister) throw new ApiError({ statusCode: 403, message: "Forbidden: Invalid sister ID or user is not a sister" });

    // Fetch the brother's name to use as a prefix
    const brother = await getUser(brotherId, ['name']);
    if (!brother) throw new ApiError({ statusCode: 404, message: "Brother not found" });

    // Format the brother's name (remove spaces, uppercase)
    const formattedName = brother.name.replace(/\s+/g, '').toUpperCase();
    const prefix = `${formattedName}-RAKHI`;

    // Generate a unique coupon code
    const couponCode = generateCouponCode(prefix);
    // Create the coupon in the database
    const newCoupon = await Coupon.create({
        couponCode,
        amount,
        brotherId,
        sisterId,
        expiry
    });

    return newCoupon;
};

export const getCouponService = async (brotherId: string) => {
    const coupons = await Coupon.find({ brotherId }).populate('sisterId', 'name phoneNumber');
    return coupons;
};

export const getSisterCouponService = async (brotherId: string, sisterId: string) => {
    const coupons = await Coupon.find({ brotherId, sisterId });
    return coupons;
};

export const deleteCouponService = async (couponId: string, brotherId: string) => {
    const deletedCoupon = await Coupon.findOneAndDelete({ _id: couponId, brotherId });
    
    if (!deletedCoupon) {
        throw new ApiError({ 
            statusCode: 404, 
            message: "Coupon not found or you do not have permission to delete it" 
        });
    }
    
    return true;
};

interface IEditCouponParams {
    brotherId: string;
    couponId: string;
    amount?: number;
    expiry?: Date | null;
}

export const editCouponService = async ({ brotherId, couponId, amount, expiry }: IEditCouponParams) => {
    
    const query = { brotherId, _id: couponId };    
    const updateQuery: any = {
        $set: {},
    } 

    const isDate = expiry != null? !isNaN(new Date(expiry).getTime()): null;
    
    if(amount ) updateQuery.$set.amount = amount;
    if( expiry == null ) {
        updateQuery.$unset = { expiry };
    }else if( isDate ) {
        updateQuery.$set.expiry = expiry;
    }
  
    const updatedCoupon = await Coupon.findOneAndUpdate(
        query,
        updateQuery,
        { returnDocument: 'after', runValidators: true }
    );

    if (!updatedCoupon) {
        throw new ApiError({ 
            statusCode: 404, 
            message: "Coupon not found or you do not have permission to edit it" 
        });
    }

    return updatedCoupon;
};
