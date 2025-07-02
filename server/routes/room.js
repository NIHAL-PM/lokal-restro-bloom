import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get rooms
router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.rooms || []);
});

// Add room
router.post('/', (req, res) => {
  const db = getDb();
  const room = { ...req.body, id: uuidv4() };
  db.rooms = db.rooms || [];
  db.rooms.push(room);
  saveDb(db);
  res.json(room);
});

// Update room
router.put('/:id', (req, res) => {
  const db = getDb();
  db.rooms = db.rooms || [];
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.rooms[idx] = { ...db.rooms[idx], ...req.body };
  saveDb(db);
  res.json(db.rooms[idx]);
});

// Delete room
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.rooms = db.rooms || [];
  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

export default router;
