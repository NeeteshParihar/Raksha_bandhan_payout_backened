import { Attempt } from '../models/attempt.js';
import { ApiError } from '../utils/error_handling.js';

export const deleteAllAttemptsOfQuizService = async (quizId: string) => {
    try {
        await Attempt.deleteMany({ quizId });
    } catch (error) {
        throw new ApiError({ statusCode: 500, message: "Failed to delete previous attempts for the quiz" });
    }
};

