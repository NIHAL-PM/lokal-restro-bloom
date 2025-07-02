import express from 'express';
import { printReceipt } from '../services/printerService.js';

const router = express.Router();

router.post('/print', async (req, res) => {
  try {
    await printReceipt(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
