import { Quiz, IQuiz, QuizStatus } from '../models/quiz.js';
import { ApiError } from '../utils/error_handling.js';
import { checkIsSister } from './user.js';
import { IparsedQuestion } from '../utils/quiz.js';
import { Schema, Types } from 'mongoose';

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

    return newQuiz;
};

export const getQuizService = async (quizId: string, userId: string): Promise<IQuiz> => {
    // First, fetch the quiz without populating
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
        throw new ApiError({ statusCode: 404, message: "Quiz not found" });
    }

    // Verify permissions using the raw IDs
    if (String(quiz.brotherId) !== userId && String(quiz.sisterId) !== userId) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have access to this quiz" });
    }

    if (userId === String(quiz.sisterId)) return quiz;
    // Populate sisterId after verification to save DB overhead if unauthorized

    await quiz.populate('sisterId', '-password');

    // Convert to plain object to manipulate properties
    const quizObj: any = quiz.toObject();

    // Rename sisterId to sister for the frontend
    quizObj.sister = quizObj.sisterId;
    delete quizObj.sisterId;

    return quizObj;
};

// "_id": "6a896c4031f2815e81699783",
interface IAllQuizes {
    _id?: Types.ObjectId;
    title: string;
    brotherId: Types.ObjectId;
    sisterId: Types.ObjectId;
    status: QuizStatus;
    __v: number;
}

export const getAllQuizesOfSisterService = async (brotherId: string, sisterId: string): Promise<IAllQuizes[]> => {
    // Exclude the nested questions array to keep the payload small
    const quizzes = await Quiz.find({ brotherId, sisterId }).select('title brotherId  sisterId status').lean();
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

