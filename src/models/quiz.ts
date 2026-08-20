import mongoose, { Schema } from 'mongoose';
import { IQuestion, questionSchema } from './question.js';

export enum QuizStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface IQuiz {
  brotherId: mongoose.Types.ObjectId;
  sisterId: mongoose.Types.ObjectId;
  status: QuizStatus;
  questions: IQuestion[];
}

const quizSchema = new Schema<IQuiz>(
  {
    brotherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sisterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(QuizStatus), default: QuizStatus.PENDING },
    questions: [questionSchema], // Questions are nested directly in the Quiz
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
