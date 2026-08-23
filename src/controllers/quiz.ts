import { Response, NextFunction } from 'express';
import { IapiRequest } from '../utils/types.js';
import { ApiError } from '../utils/error_handling.js';
import { createQuizService, getQuizService, getAllQuizesOfSisterService, addQuestionToQuizService } from '../services/quiz.js';
import { parseQuestionData } from '../utils/quiz.js';
import { UserRole } from '../models/users.js';
import { deleteCloudinaryFiles } from '../services/cloudinary.js';

export const createQuiz = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { title, sisterId } = req.body;
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can create quizzes" });
        }

        if (!brotherId || !sisterId || !title) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (title, sisterId)" });
        }

        const newQuiz = await createQuizService({
            title,
            brotherId: String(brotherId),
            sisterId
        });

        res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            data: newQuiz
        });
    } catch (error) {
        next(error);
    }
};

export const getQuiz = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { quizId } = req.params;

        if (!userId || !quizId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (quizId)" });
        }

        const quiz = await getQuizService(quizId as string, String(userId));

        res.status(200).json({
            success: true,
            message: "Quiz fetched successfully",
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

export const getAllQuizesOfSister = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const brotherId = req.user?.userId;
        const role = req.user?.role;
        const { sisterId } = req.params;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can fetch all quizzes of a sister" });
        }

        if (!brotherId || !sisterId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (sisterId)" });
        }

        const quizzes = await getAllQuizesOfSisterService(String(brotherId), sisterId as string);

        res.status(200).json({
            success: true,
            message: "Quizzes fetched successfully",
            data: quizzes
        });
    } catch (error) {
        next(error);
    }
};

export const addQuestionToQuiz = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { quizId } = req.params;
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        console.log(role);
        console.log(req.body);

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can add questions to a quiz" });
        }

        if (!brotherId || !quizId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (quizId)" });
        }

        const parsedQuestionData = parseQuestionData(req.body, req.files);
        const newQuestion = await addQuestionToQuizService(quizId as string, String(brotherId), parsedQuestionData);

        res.status(201).json({
            success: true,
            message: "Question added successfully",
            data: newQuestion
        });
        
    } catch (error) {
        if (req.files) {
            const files = req.files as any[];
            const publicIds = files.map(file => file.filename);
            if (publicIds.length > 0) {
                await deleteCloudinaryFiles(publicIds);
            }
        }
        next(error);
    }
};
