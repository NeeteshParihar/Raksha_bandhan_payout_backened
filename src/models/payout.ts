import mongoose, { Document, Schema } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
}

export interface IPayout {
  brotherId: mongoose.Types.ObjectId;
  sisterId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  upiId: string;
  totalAmount: number;
  couponAmount: number;
  counponCode?: string;
  quizAmount: number;
  status: PayoutStatus;
}

// the payout will only store one success payout of a single quiz
const payoutSchema = new Schema<IPayout>(
  {
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
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz', // We'll create the Quiz model soon
      required: true,
      unique: true,
    },
    upiId: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    couponAmount: {
      type: Number,
      default: 0,
    },
    counponCode: {
      type: String,     
    },
    quizAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
