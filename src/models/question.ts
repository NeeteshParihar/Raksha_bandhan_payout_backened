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

export interface IOption {
  type: OptionType;
  value: string;
  publicId?: string;
  _id?: mongoose.Types.ObjectId | string
}


export interface IQuestion {
  _id?: mongoose.Types.ObjectId | string; // Automatically added by mongoose
  quesDesc: string;
  questionMediaUrl?: string;
  questionMediaId?: string;
  questionType: QuestionType; 
  optionsList: IOption[]; // Included this for MCQ options
  answerList: string[]; 
  level: QuestionLevel;
  scoreAmount: number;
}

const optionSchema = new Schema<IOption>({
  type: { type: String, enum: Object.values(OptionType), required: true },
  value: {
    type: String,
    required: true
  },
  publicId: { type: String, required: false }
});


export const questionSchema = new Schema<IQuestion>({
  quesDesc: { type: String, required: true },
  questionMediaUrl: { type: String, required: false },
  questionMediaId: { type: String, required: false },
  questionType: { type: String, enum: Object.values(QuestionType), required: true },
  optionsList: {
    type: [optionSchema], default: []
  },
  answerList: { 
    type: [String], 
    required: true,
    validate: [
      (val: string[]) => val.length > 0, 
      'A question must have at least one answer'
    ]
  }, 
  level: { type: String, enum: Object.values(QuestionLevel), default: QuestionLevel.NOOB },
  scoreAmount: { type: Number, required: true, min: 0 },
});



