import mongoose, { Schema } from 'mongoose';

export enum QuestionType {
  MCQ = 'MCQ',
  TEXT = 'TEXT',
}

export enum OptionType {
  IMG = 'IMG',
  TEXT = 'TEXT',
}

export enum QuestionLevel {
  NOOB = 'NOOB',       // easy
  PRO = 'PRO',         // medium
  LEGEND = 'LEGEND',   // hard
}

export interface IQuestion {
  _id?: mongoose.Types.ObjectId; // Automatically added by mongoose
  quesDesc: string;
  questionMediaUrl?: string;
  questionType: QuestionType;
  optionType: OptionType;
  optionsList: string[]; // Included this for MCQ options
  answerList: string[];
  level: QuestionLevel;
  scoreAmount: number;
}

export const questionSchema = new Schema<IQuestion>({
  quesDesc: { type: String, required: true },
  questionMediaUrl: { type: String, required: false },
  questionType: { type: String, enum: Object.values(QuestionType), required: true },
  optionType: { type: String, enum: Object.values(OptionType), required: true },
  optionsList: { type: [String], default: [] },
  answerList: { type: [String], required: true },
  level: { type: String, enum: Object.values(QuestionLevel), default: QuestionLevel.NOOB },
  scoreAmount: { type: Number, required: true, min: 0 },
});
