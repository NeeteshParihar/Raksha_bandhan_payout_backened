import { Response, NextFunction } from 'express';
import { IapiRequest } from '../utils/types.js';
import { ApiError } from '../utils/error_handling.js';
import { createQuizService, getQuizService, getAllQuizesOfSisterService, addQuestionToQuizService, deleteQuestionService, UpdateQuizStatusService, deleteQuizService, UpdateQuizStateService } from '../services/quiz.js';
import { parseQuestionData } from '../utils/quiz.js';
import { UserRole } from '../models/users.js';
import { deleteCloudinaryFiles } from '../services/cloudinary.js';
import { QuizActions, QuizStatus, QuizState } from '../models/quiz.js';
import { deleteAllAttemptsOfQuizService } from '../services/attempt.js';

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
            data: {
                totalAmount: 0,
                payoutStats: {
                    pending: 0,
                    success: 0,
                    failed: 0
                },
                ...newQuiz
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getQuiz = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { quizId } = req.params;

        if (!userId || !quizId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (quizId)" });
        }

        const quiz = await getQuizService(quizId as string, String(userId), role);

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
        const userId = req.user?.userId;
        const role = req.user?.role
        let brotherId;
        let sisterId;

        if (role === UserRole.BROTHER) {
            brotherId = userId;
            sisterId = req.params.userId;
        } else {
            sisterId = userId;
            brotherId = req.params.userId;
        }


        if (!brotherId || !sisterId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (sisterId)" });
        }

        const quizzes = await getAllQuizesOfSisterService(String(brotherId), sisterId as string, role);

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

export const deleteQuestion = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { quizId, questionId } = req.params;



        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can delete questions" });
        }

        if (!brotherId || !quizId || !questionId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (quizId, questionId)" });
        }



        const deletedQuestion = await deleteQuestionService(quizId as string, String(brotherId), questionId as string);

        // Delete uploaded files associated with this question from Cloudinary
        const publicIds: string[] = [];
        if (deletedQuestion.questionMediaId) {
            publicIds.push(deletedQuestion.questionMediaId);
        }
        if (deletedQuestion.optionsList) {
            deletedQuestion.optionsList.forEach(opt => {
                if (opt.publicId) publicIds.push(opt.publicId);
            });
        }

        if (publicIds.length > 0) {
            // Delete asynchronously without awaiting if we don't want to block the response,
            // but awaiting is fine here.
            await deleteCloudinaryFiles(publicIds);
        }

        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

export const updateQuizStatus = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId;
        const role = req.user?.role;
        const action: any = req.query.action;
        const quizId: any = req.params.quizId;

        let result: any;

        if (action === QuizActions.START && role === UserRole.SISTER) {
            result = await UpdateQuizStatusService(quizId, userId!, QuizStatus.IN_PROGRESS);
        } else if (action === QuizActions.SUBMIT && role === UserRole.SISTER) {
            result = await UpdateQuizStatusService(quizId, userId!, QuizStatus.COMPLETED);
        } else if (action === QuizActions.RESET && role === UserRole.BROTHER) {
            result = await UpdateQuizStatusService(quizId, userId!, QuizStatus.PENDING);
            await deleteAllAttemptsOfQuizService(quizId as string);
        } else {
            throw new ApiError({ statusCode: 400, message: "User action is not valid" })
        }
        res.status(200).json({
            success: true,
            message: "Status updated successfully!",
            data: result
        })
    } catch (err) {
        next(err);
    }
}

export const deleteQuiz = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { quizId } = req.params;
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can delete quizzes" });
        }

        if (!quizId || !brotherId) {
            throw new ApiError({ statusCode: 400, message: "missing required fields (quizId)" });
        }

        const deletedQuiz = await deleteQuizService(quizId as string, String(brotherId));

        // Also delete attempts associated with the quiz
        await deleteAllAttemptsOfQuizService(quizId as string);

        // Gather all public IDs for media in the quiz to delete them from Cloudinary
        const publicIds: string[] = [];
        if (deletedQuiz.questions && deletedQuiz.questions.length > 0) {
            
            deletedQuiz.questions.forEach((q: any) => {
                if (q.questionMediaId) publicIds.push(q.questionMediaId);
                if (q.optionsList && q.optionsList.length > 0) {
                    q.optionsList.forEach((opt: any) => {
                        if (opt.publicId) publicIds.push(opt.publicId);
                    });
                }
            });
        }

        if (publicIds.length > 0) {
            // Delete asynchronously
            deleteCloudinaryFiles(publicIds);
        }

        res.status(200).json({
            success: true,
            message: "Quiz deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const updateQuizState = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const { quizId } = req.params;
        const { state } = req.body;
        const brotherId = req.user?.userId;
        const role = req.user?.role;

        if (role !== UserRole.BROTHER) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: Only brothers can update quiz state" });
        }

        if (!quizId || !state) {
            throw new ApiError({ statusCode: 400, message: "Missing required fields (quizId, state)" });
        }

        if (!Object.values(QuizState).includes(state)) {
            throw new ApiError({ statusCode: 400, message: "Invalid quiz state" });
        }

        const updatedQuiz = await UpdateQuizStateService(quizId as string, String(brotherId), state as QuizState);

        res.status(200).json({
            success: true,
            message: `Quiz state updated to ${state} successfully`,
            data: updatedQuiz
        });
    } catch (error) {
        next(error);
    }
};

