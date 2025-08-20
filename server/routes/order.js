import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get orders
router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(db.orders || []);
});

// Add order
router.post('/', async (req, res) => {
  const db = await getDb();
  const order = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
  db.orders = db.orders || [];
  db.orders.push(order);
  await saveDb(db);
  res.json(order);
});

// Update order
router.put('/:id', async (req, res) => {
  const db = await getDb();
  db.orders = db.orders || [];
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.orders[idx] = { ...db.orders[idx], ...req.body };
  await saveDb(db);
  res.json(db.orders[idx]);
});

// Delete order
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  db.orders = db.orders || [];
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  await saveDb(db);
  res.json({ success: true });
});

export default router;
