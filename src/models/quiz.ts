import mongoose, { Schema } from 'mongoose';
import { IQuestion, questionSchema } from './question.js';

export enum QuizStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum QuizActions {
  START = "START",
  SUBMIT = "SUBMIT",
  RESET = "RESET"
}

export enum QuizState {
  DRAFT = 'DRAFT',
  READY = 'READY'
}

export interface IQuiz {
  title: string;
  brotherId: mongoose.Types.ObjectId;
  sisterId: mongoose.Types.ObjectId;
  status: QuizStatus;
  quizState: QuizState;
  questions: IQuestion[];
}

const quizSchema = new Schema<IQuiz>(
  {      
    title: {         
      type: String,
      required: true
    },
    brotherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // brother will create the quiz
    sisterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // which sister can attend the quiz
    status: { type: String, enum: Object.values(QuizStatus), default: QuizStatus.PENDING },
    quizState: { type: String, enum: Object.values(QuizState), default: QuizState.DRAFT },
    questions: {
      type: [questionSchema], // Questions are nested directly in the Quiz
      default: []  
    }, 
  },
  { timestamps: true }
);

quizSchema.index({ brotherId: 1, sisterId: 1 }); 

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
