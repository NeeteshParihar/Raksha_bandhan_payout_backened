import { Router } from 'express';
import { createPayout, redirectUPI, getQuizPayout, updatePayoutStatus, getPayoutsByBrother, getPayoutById } from '../controllers/payout.js';
import { validateUser } from '../middlewares/validateUser.js';

const router = Router();

// Endpoint for redirecting HTTP to UPI scheme
router.get('/pay', redirectUPI);

// Create a payout request (Sister action)
router.post('/:quizId', validateUser, createPayout);

// Get a payout by quizId
router.get('/:quizId', validateUser, getQuizPayout); 

// Update the status of a payout
router.patch('/:payoutId/status', validateUser, updatePayoutStatus);

// Get all payouts for a brother
router.get('/brother/all', validateUser, getPayoutsByBrother);

// Get a payout by its ID
router.get('/payout/:payoutId', validateUser, getPayoutById);


export default router;
