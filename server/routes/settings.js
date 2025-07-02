import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';

const router = express.Router();

// Get settings
router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.settings || {});
});

// Update settings
router.put('/', (req, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb(db);
  res.json(db.settings);
});

export default router;
