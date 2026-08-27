import { Payout, PayoutStatus } from '../models/payout.js';
import { ApiError } from '../utils/error_handling.js';

interface ICreatePayoutParams {
  sisterId: string;
  quizId: string;
  upiId: string;
  totalAmount: number;
  couponAmount: number;
  quizAmount: number;
  couponCode: string;
}

export const createPayoutService = async (params: ICreatePayoutParams) => {
  const { sisterId, quizId, upiId, totalAmount, couponAmount, quizAmount, couponCode } = params;

  // Check if a payout already exists for this quiz with PENDING or SUCCESS status
  const existingPayout = await Payout.findOne({
    quizId,
    status: { $in: [PayoutStatus.PENDING, PayoutStatus.SUCCESS] }
  });

  if (existingPayout) {
    if (existingPayout.status === PayoutStatus.SUCCESS) {
      throw new ApiError({ statusCode: 400, message: "A successful payout already exists for this quiz." });
    } else {
      throw new ApiError({ statusCode: 400, message: "A payout is already pending for this quiz." });
    }
  }

  // Create the new payout
  const payout = await Payout.create({
    sisterId,
    quizId,
    upiId,
    totalAmount,
    couponAmount,
    quizAmount,
    counponCode: couponCode, // mapping to model's field name 'counponCode'
    status: PayoutStatus.PENDING, // default value, setting it explicitly for clarity
  });

  return payout;
};



