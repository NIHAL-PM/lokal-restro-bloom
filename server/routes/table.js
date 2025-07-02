import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get tables
router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.tables || []);
});

// Add table
router.post('/', (req, res) => {
  const db = getDb();
  const table = { ...req.body, id: uuidv4() };
  db.tables = db.tables || [];
  db.tables.push(table);
  saveDb(db);
  res.json(table);
});

// Update table
router.put('/:id', (req, res) => {
  const db = getDb();
  db.tables = db.tables || [];
  const idx = db.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.tables[idx] = { ...db.tables[idx], ...req.body };
  saveDb(db);
  res.json(db.tables[idx]);
});

// Delete table
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.tables = db.tables || [];
  db.tables = db.tables.filter(t => t.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

export default router;
