import { Response } from "express";
import { IapiRequest } from "../utils/types.js";
import { ApiError } from "../utils/error_handling.js";
import { getQuizOwners, checkUserQuizQuestionAnswer } from "../services/quiz.js";
import { createAttemptService, getAllAttemptsOfQuiz } from "../services/attempt.js";

export const createAttempt = async (req: IapiRequest, res: Response) => {
    try {
        const quizId = req.params.quizId as string;
        const questionId = req.params.questionId as string;
        const { answerList } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized" });
        }

        if (!answerList || !Array.isArray(answerList)) {
            throw new ApiError({ statusCode: 400, message: "answerList must be provided as an array" });
        }

        // Validate sisterId (Role is validated by middleware)
        const quizOwners = await getQuizOwners(quizId);
        if (quizOwners.sisterId !== userId) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: You are not authorized to attempt this quiz" });
        }

        // Check the answerList using checkUserQuizQuestionAnswer
        const { isCorrect, amountEarned } = await checkUserQuizQuestionAnswer(quizId, questionId, answerList);

        // Create the attempt
        const attempt = await createAttemptService(quizId, questionId, isCorrect, amountEarned);

        return res.status(201).json({
            message: "Attempt created successfully",
            attempt
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError({ statusCode: 500, message: error?.message || "Failed to create attempt" });
    }
};

export const getAllAttemptsOfQuizController = async (req: IapiRequest, res: Response) => {
    try {
        const quizId = req.params.quizId as string;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized" });
        }

        const quizOwners = await getQuizOwners(quizId);
        
        if (quizOwners.brotherId !== userId && quizOwners.sisterId !== userId) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have access to this quiz's attempts" });
        }

        const attempts = await getAllAttemptsOfQuiz(quizId);

        return res.status(200).json({
            message: "Attempts fetched successfully",
            data: attempts
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError({ statusCode: 500, message: error?.message || "Failed to fetch attempts" });
    }
};
