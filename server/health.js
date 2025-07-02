import express from 'express';
import { healthCheck } from './monitor.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(healthCheck());
});

export default router;
