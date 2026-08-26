import { QuestionType, QuestionLevel, OptionType } from "../models/question.js";


export type Option = {
    type: OptionType,
    value: string,
    publicId?: string
}

export interface IparsedQuestion {
    quesDesc: string;
    questionType: QuestionType;
    questionMediaUrl?: string;
    questionMediaId?: string;
    level: QuestionLevel;
    scoreAmount: Number;
    answerList: string[];
    optionsList: Option[];

}

export const parseQuestionData =  (body: any, files: any): IparsedQuestion => {

    const quesDesc = body.quesDesc;
    const questionType = body.questionType;
    const level = body.level;
    const scoreAmount = body.scoreAmount;
    const answerList = JSON.parse(body.answerList);
    const optionsList = questionType === QuestionType.MCQ ? JSON.parse(body.optionsList): [];

    files.forEach( (file: any) => {
        const index = parseInt(file.fieldname.split('-')[2])-1 ;
        if(file.fieldname !== "questionMediaUrl") {
            optionsList[index].value = file.path;
            optionsList[index].publicId = file.filename;
        }
    }) 

    const questionMediaUrlObj =  files.find( ( file: any ) => file.fieldname === "questionMediaUrl" );
    const questionMediaUrl = questionMediaUrlObj ? questionMediaUrlObj.path : undefined;
    const questionMediaId = questionMediaUrlObj ? questionMediaUrlObj.filename : undefined;

    return {
        quesDesc,
        questionType,
        questionMediaUrl,
        questionMediaId,
        level,
        scoreAmount,
        answerList,
        optionsList
    }

}
