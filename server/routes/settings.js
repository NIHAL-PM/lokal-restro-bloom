import express from 'express';
import { getDb, saveDb } from '../services/dbService.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(db.settings || {});
});

// Update settings
router.put('/', async (req, res) => {
  const db = await getDb();
  db.settings = { ...db.settings, ...req.body };
  await saveDb(db);
  res.json(db.settings);
});

export default router;
