import { Router } from 'express';
import { createQuiz, getQuiz, getAllQuizesOfSister, addQuestionToQuiz, deleteQuestion, updateQuizStatus } from '../controllers/quiz.js';
import { validateUser } from '../middlewares/validateUser.js';
import { validateUserRole } from '../middlewares/validateUserRole.js';
import { UserRole } from '../models/users.js';

import upload from '../config/cloundinary.js';

const router = Router();

// Create a new quiz with questions (Brother action)
router.post('/', validateUser, createQuiz);

// Fetch all quizzes for a specific sister (Brother action)
router.get('/sister/:userId', validateUser, getAllQuizesOfSister);

// Fetch single quiz state including questions (Brother or Sister action)
router.get('/:quizId', validateUser, getQuiz);

// add question in the quiz
router.post("/:quizId/question", validateUser, validateUserRole(UserRole.BROTHER),  upload.any(), addQuestionToQuiz);

// delete question from the quiz
router.delete("/:quizId/question/:questionId", validateUser, validateUserRole(UserRole.BROTHER), deleteQuestion );

router.patch("/:quizId", validateUser, updateQuizStatus );

export default router;


