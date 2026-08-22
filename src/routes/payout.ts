import { Router } from 'express';

const router = Router();

// Request OTP for payout verification (Sister action)
router.post('/request-otp', (req, res) => {
  res.send('Request OTP API');
});

// Verify OTP and trigger mocked payout (Sister action)
router.post('/verify-and-pay', (req, res) => {
  res.send('Verify OTP & Pay API');
});

export default router;
