import mongoose, { Schema } from 'mongoose';

export interface IAttempt {
  quizId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  isCorrect: boolean;
  amountEarned: number;
}

const attemptSchema = new Schema<IAttempt>(
  {
    quizId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Quiz', 
      required: true 
    },
    questionId: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
    isCorrect: { 
      type: Boolean, 
      required: true 
    },
    amountEarned: {
      type: Number,
      required: true,
      min: 0
    },
  },
  { timestamps: true }
);

// Ensures a sister can only have one attempt per question per quiz
attemptSchema.index({ quizId: 1, questionId: 1 }, { unique: true });

export const Attempt = mongoose.model<IAttempt>('Attempt', attemptSchema);
