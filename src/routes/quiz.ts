import { Router } from 'express';

const router = Router();

// Create a new quiz with questions (Brother action)
router.post('/', (req, res) => {
  res.send('Create Quiz API');
});

// Fetch quiz state including questions (Sister action)
router.get('/:id', (req, res) => {
  res.send('Get Quiz State API');
});

export default router;
