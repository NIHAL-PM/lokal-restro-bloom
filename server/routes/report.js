import express from 'express';
import { getDb } from '../services/dbService.js';

const router = express.Router();

// Example: Get sales report
router.get('/sales', async (req, res) => {
  const db = await getDb();
  const orders = db.orders || [];
  const total = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  res.json({ total, count: orders.length });
});

export default router;
