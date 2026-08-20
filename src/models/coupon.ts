import mongoose, { Schema } from 'mongoose';

export enum CouponStatus {
  UNUSED = 'UNUSED',
  APPLIED = 'APPLIED',
}

export interface ICoupon {
  couponCode: string;
  amount: number;
  status: CouponStatus;
  expiry?: Date;
  brotherId: mongoose.Types.ObjectId;
  sisterId: mongoose.Types.ObjectId;
}

const couponSchema = new Schema<ICoupon>(
  { 
    couponCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(CouponStatus),
      default: CouponStatus.UNUSED,
    },
    expiry: {
      type: Date,
    },
    brotherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sisterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
