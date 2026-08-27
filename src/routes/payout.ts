import { Router } from 'express';
import { createPayout, redirectUPI, getSuccessfulPayout, updatePayoutStatus, getPayoutsByBrother } from '../controllers/payout.js';
import { validateUser } from '../middlewares/validateUser.js';

const router = Router();

// Endpoint for redirecting HTTP to UPI scheme
router.get('/pay', redirectUPI);

// Create a payout request (Sister action)
router.post('/:quizId', validateUser, createPayout);

// Get a successful payout by quizId
router.get('/success/:quizId', validateUser, getSuccessfulPayout);

// Update the status of a payout
router.patch('/:payoutId/status', validateUser, updatePayoutStatus);

// Get all payouts for a brother
router.get('/brother/all', validateUser, getPayoutsByBrother);

export default router;
