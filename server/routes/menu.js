import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get menu
router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(db.menu || []);
});

// Add menu item
router.post('/', async (req, res) => {
  const db = await getDb();
  const item = { ...req.body, id: uuidv4() };
  db.menu = db.menu || [];
  db.menu.push(item);
  await saveDb(db);
  res.json(item);
});

// Update menu item
router.put('/:id', async (req, res) => {
  const db = await getDb();
  db.menu = db.menu || [];
  const idx = db.menu.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.menu[idx] = { ...db.menu[idx], ...req.body };
  await saveDb(db);
  res.json(db.menu[idx]);
});

// Delete menu item
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  db.menu = db.menu || [];
  db.menu = db.menu.filter(i => i.id !== req.params.id);
  await saveDb(db);
  res.json({ success: true });
});

export default router;
