import { Quiz, IQuiz, QuizStatus, QuizState } from '../models/quiz.js';
import { ApiError } from '../utils/error_handling.js';
import { checkIsSister } from './user.js';
import { IparsedQuestion } from '../utils/quiz.js';
import { Schema, Types } from 'mongoose';
import { QuestionType } from '../models/question.js';

interface ICreateQuizParams {
    title: string;
    brotherId: string;
    sisterId: string;
}

export const createQuizService = async ({ title, brotherId, sisterId }: ICreateQuizParams): Promise<IQuiz> => {
    // Check if the sister exists and has the correct role
    const isSister = await checkIsSister(sisterId);
    if (!isSister) throw new ApiError({ statusCode: 403, message: "Forbidden: Invalid sister ID or user is not a sister" });

    // Create the quiz
    const newQuiz = await Quiz.create({
        title,
        brotherId,
        sisterId,
    });

    return newQuiz.toObject();
};

interface IQuizResponse extends Partial<IQuiz> {
  totalAmount?: number;
   brother?: any;
   sister?: any;
}
export const getQuizService = async (quizId: string, userId: string, role?: string): Promise<IQuizResponse> => {
    // First, fetch the quiz without populating
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found" });
    }

    // Verify permissions using the raw IDs
    if (String(quiz.brotherId) !== userId && String(quiz.sisterId) !== userId) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have access to this quiz" });
    }

    if (role === 'SISTER') {
        if (quiz.quizState === QuizState.DRAFT || !quiz.questions || quiz.questions.length === 0) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Quiz is in draft state or has no questions" });
        }
    }

    let totalAmount = 0;
    for (let question of quiz.questions) {
        const score = question.scoreAmount;
        totalAmount += score;
    }

    // if sister is fetching the quiz than populate the brother data else if brother is fetching then populate with sister data
    if (userId === String(quiz.brotherId))
        await quiz.populate('sisterId', '-password');
    else
        await quiz.populate('brotherId', '-password');

    // Convert to plain object to manipulate properties
    const quizObj: any = quiz.toObject();

    // if brother is fetching
    if (userId === String(quiz.brotherId)) {
        quizObj.sister = quizObj.sisterId;
        delete quizObj.sisterId
    } else {
        quizObj.brother = quizObj.brotherId;
        delete quizObj.brotherId;
    }

    return {
        ...quizObj, totalAmount
    }
};

// "_id": "6a896c4031f2815e81699783",
interface IAllQuizes {
    _id?: Types.ObjectId;
    title: string;
    brotherId: Types.ObjectId;
    sisterId: Types.ObjectId;
    status: QuizStatus;
    __v: number;
    totalAmount?: number;
    payoutStats?: {
        pending: number;
        success: number;
        failed: number;
    };
}

export const getAllQuizesOfSisterService = async (brotherId: string, sisterId: string, role?: string): Promise<IAllQuizes[]> => {
    const matchStage: any = {
        brotherId: new Types.ObjectId(brotherId),
        sisterId: new Types.ObjectId(sisterId)
    };

    if (role === 'SISTER') {
        matchStage.quizState = { $ne: QuizState.DRAFT };
        matchStage['questions.0'] = { $exists: true };
    }

    const quizzes = await Quiz.aggregate([
        {
            $match: matchStage
        },
        {
            $unwind: {
                path: "$questions",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: "$_id",
                title: { $first: "$title" },
                brotherId: { $first: "$brotherId" },
                sisterId: { $first: "$sisterId" },
                status: { $first: "$status" },
                totalAmount: {
                    $sum: { $ifNull: ["$questions.scoreAmount", 0] }
                }
            }
        },
        {
            $lookup: {
                from: "payouts",
                localField: "_id",
                foreignField: "quizId",
                as: "payouts"
            }
        },
        {
            $addFields: {
                payoutStats: {
                    pending: {
                        $size: {
                            $filter: {
                                input: "$payouts",
                                as: "p",
                                cond: { $eq: ["$$p.status", "PENDING"] }
                            }
                        }
                    },
                    success: {
                        $size: {
                            $filter: {
                                input: "$payouts",
                                as: "p",
                                cond: { $eq: ["$$p.status", "SUCCESS"] }
                            }
                        }
                    },
                    failed: {
                        $size: {
                            $filter: {
                                input: "$payouts",
                                as: "p",
                                cond: { $eq: ["$$p.status", "FAILED"] }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                payouts: 0
            }
        }
    ]);
    return quizzes;
};

export const addQuestionToQuizService = async (quizId: string, brotherId: string, questionData: IparsedQuestion) => {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found" });
    }

    if (String(quiz.brotherId) !== brotherId) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have permission to add questions to this quiz" });
    }

    quiz.questions = quiz.questions || [];
    quiz.questions.push(questionData as any);
    await quiz.save();

    return quiz.questions[quiz.questions.length - 1];
};

export const deleteQuestionService = async (quizId: string, brotherId: string, questionId: string) => {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found" });
    }

    if (String(quiz.brotherId) !== brotherId) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have permission to delete questions from this quiz" });
    }

    if (!quiz.questions) {
        throw new ApiError({ statusCode: 404, message: "Question not found" });
    }

    const questionIndex = quiz.questions.findIndex(q => String(q._id) === questionId);
    if (questionIndex === -1) {
        throw new ApiError({ statusCode: 404, message: "Question not found" });
    }

    const deletedQuestion = quiz.questions[questionIndex];
    quiz.questions.splice(questionIndex, 1);
    await quiz.save();
    return deletedQuestion;
};


export const UpdateQuizStatusService = async (quizId: string, userId: string, status: QuizStatus) => {
    const quiz = await Quiz.findById(quizId);
    if (!quiz)
        throw new ApiError({ statusCode: 404, message: "Quiz not found!" });
    if (userId !== String(quiz.brotherId) && userId !== String(quiz.sisterId))
        throw new ApiError({ statusCode: 403, message: "Forbidden! you are not autherized" });
    // check for the flow of the sisters actions
    if (
        (status === QuizStatus.IN_PROGRESS && quiz.status !== QuizStatus.PENDING) ||
        (status === QuizStatus.COMPLETED && quiz.status !== QuizStatus.IN_PROGRESS)
    ) throw new ApiError({
        statusCode: 400, message: "Invalid action"
    })
    quiz.status = status;
    await quiz.save();
    return quiz;
}

export const UpdateQuizStateService = async (quizId: string, brotherId: string, state: QuizState) => {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found" });
    }

    if (String(quiz.brotherId) !== brotherId) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have permission to modify this quiz" });
    }

    if (state === QuizState.READY) {
        if (!quiz.questions || quiz.questions.length === 0) {
            throw new ApiError({ statusCode: 400, message: "Cannot mark quiz as READY: Quiz must have at least one question" });
        }
    }

    quiz.quizState = state;
    await quiz.save();
    return quiz;
};


export const checkUserQuizQuestionAnswer = async (quizId: string, questionId: string, answerList: string[]) => {
    const quiz = await Quiz.findById(quizId);
    if (!quiz)
        throw new ApiError({ statusCode: 404, message: "quiz not found!" });

    const question = quiz.questions?.find((ques) => String(ques._id) === questionId);
    if (!question)
        throw new ApiError({ statusCode: 404, message: "question is not found inside the quiz!" });
    if (question.questionType === QuestionType.TEXT && answerList.length != 1)
        throw new ApiError({ statusCode: 400, message: "Only one answer is allowed in case of TEXT typed questions" })

    if (question.questionType === QuestionType.TEXT) {
        const ans = answerList[0];
        const result = question.answerList.includes(ans); // check agains variations in case of text answer

        const amountEarned = result === true ? question.scoreAmount : 0;
        return {
            isCorrect: result,
            amountEarned
        }
    }
    // check the MCQ type : check strictly to ensure all the options are present in user answer
    let result = true;
    for (const savedAnswer of question.answerList) {
        if (!answerList.includes(savedAnswer)) {
            result = false;
            break;
        }
    }

    const amountEarned = result === true ? question.scoreAmount : 0;
    return {
        isCorrect: result,
        amountEarned
    }
}

interface IQuizOwers {
    _id: string,
    brotherId: string,
    sisterId: string
}

export const getQuizOwners = async (quizId: string): Promise<IQuizOwers> => {
    const quiz = await Quiz.findById(quizId).select("brotherId sisterId");
    if (!quiz) throw new ApiError({ statusCode: 404, message: "quiz not found!" });
    return {
        _id: String(quiz._id),
        brotherId: String(quiz.brotherId),
        sisterId: String(quiz.sisterId)
    };
}

export const deleteQuizService = async (quizId: string, brotherId: string) => {
    const quiz = await Quiz.findOneAndDelete({ _id: quizId, brotherId });
    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found or you are not authorized to delete it" });
    }
    return quiz;
};

