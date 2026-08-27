import mongoose from 'mongoose';
import { Attempt } from '../models/attempt.js';
import { ApiError } from '../utils/error_handling.js';

export const deleteAllAttemptsOfQuizService = async (quizId: string) => {
    try {
        await Attempt.deleteMany({ quizId });
    } catch (error) {
        throw new ApiError({ statusCode: 500, message: "Failed to delete previous attempts for the quiz" });
    }
};
// make sure to check the oweners of the quiz before this in the controller
export const createAttemptService = async (quizId: string, questionId: string, isCorrect: boolean, amountEarned: number, answers: string[]) => {
    const  isExist = await Attempt.exists({ quizId, questionId});
    if(isExist) throw new ApiError({statusCode: 400, message: "Attempt Already exists"});
    const ans = await Attempt.create({
        quizId, questionId, isCorrect, amountEarned, answers
    });
    return ans;
}
// check autherization before using this
export const getAllAttemptsOfQuiz = async ( quizId: string ) => {
    const attempts = await Attempt.aggregate([
        {
            $match: {
                quizId: new mongoose.Types.ObjectId(quizId)
            }
        },
        {
            $group: {
                _id: "$quizId",
                questions: {
                    $push: {
                        questionId: "$questionId",
                        isCorrect: "$isCorrect",
                        amountEarned: "$amountEarned",
                        answers: "$answers"
                    }
                },
                totalAmountEarned: {
                    $sum: "$amountEarned"
                }
            }
        },
        {
            $project: {
                _id: 0,
                quizId: "$_id",
                questions: 1,
                totalAmountEarned: 1
            }
        }
    ]);

    return attempts.length > 0 ? attempts[0] : { quizId, questions: [] };
}
