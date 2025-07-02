import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../services/dbService.js';

const router = express.Router();

// Register admin (one-time setup)
router.post('/register', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  const db = getDb();
  if (db.admin) return res.status(403).json({ error: 'Admin already registered' });
  const hash = await bcrypt.hash(pin, 10);
  db.admin = { hash };
  saveDb(db);
  res.json({ success: true });
});

// Login
router.post('/login', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  const db = getDb();
  if (!db.admin) return res.status(403).json({ error: 'No admin registered' });
  const match = await bcrypt.compare(pin, db.admin.hash);
  if (!match) return res.status(401).json({ error: 'Invalid PIN' });
  req.session.user = { id: uuidv4(), role: 'admin' };
  res.json({ success: true });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Session check
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
