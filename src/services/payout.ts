import { Payout, PayoutStatus } from '../models/payout.js';
import { ApiError } from '../utils/error_handling.js';

interface ICreatePayoutParams {
  brotherId: string;
  sisterId: string;
  quizId: string;
  upiId: string;
  totalAmount: number;
  couponAmount: number;
  quizAmount: number;
  couponCode: string;
}

export const createPayoutService = async (params: ICreatePayoutParams) => {
  const { brotherId, sisterId, quizId, upiId, totalAmount, couponAmount, quizAmount, couponCode } = params;

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
    brotherId,
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

export const getSuccessfulPayoutByQuizIdService = async (quizId: string) => {
  const payout = await Payout.findOne({
    quizId,
    status: PayoutStatus.SUCCESS
  });
  return payout;
};

export const updatePayoutStatusService = async (userId: string, payoutId: string, status: PayoutStatus) => {
  if (status === PayoutStatus.PENDING) {
    throw new ApiError({ statusCode: 400, message: "Cannot change payout status to PENDING" });
  }

  const payout = await Payout.findById(payoutId);
  if (!payout) {
    throw new ApiError({ statusCode: 404, message: "Payout not found" });
  }

  if (String(payout.brotherId) !== userId && String(payout.sisterId) !== userId) {
    throw new ApiError({ statusCode: 403, message: "Unauthorized access to this payout" });
  }

  payout.status = status;
  await payout.save();
  return payout;
};

export const getPayoutsByBrotherIdService = async (brotherId: string) => {
  const payouts = await Payout.find({ brotherId })
    .populate('sisterId')
    .populate({
      path: 'quizId',
      select: '-questions'
    })
    .lean();
   
  return payouts.map((payout: any) => {
    const { sisterId, quizId, ...rest } = payout;
    return {
      ...rest,
      sister: sisterId,
      quiz: quizId
    };
  });
};

