import { Router } from 'express';

const router = Router();

// Submit an answer for a question (Sister action)
router.post('/', (req, res) => {
  res.send('Submit Question Attempt API');
});

export default router;
