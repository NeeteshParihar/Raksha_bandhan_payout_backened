import { Router } from 'express';
import { createPayout, redirectUPI } from '../controllers/payout.js';
import { validateUser } from '../middlewares/validateUser.js';

const router = Router();

// Endpoint for redirecting HTTP to UPI scheme
router.get('/pay', redirectUPI);

// Create a payout request (Sister action)
router.post('/:quizId', validateUser, createPayout);

export default router;
