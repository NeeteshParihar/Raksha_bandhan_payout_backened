import { Router } from 'express';
import { createAttempt, getAllAttemptsOfQuizController } from '../controllers/attempt.js';
import { validateUser } from '../middlewares/validateUser.js';
import { validateUserRole } from '../middlewares/validateUserRole.js';
import { UserRole } from '../models/users.js';

const router = Router();

// Submit an answer for a question (Sister action)
router.post('/:quizId/:questionId', validateUser, validateUserRole(UserRole.SISTER), createAttempt);

// Fetch all attempts for a quiz (Brother or Sister action)
router.get('/:quizId', validateUser, getAllAttemptsOfQuizController);

export default router;
