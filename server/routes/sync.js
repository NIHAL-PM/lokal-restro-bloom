import express from 'express';
const router = express.Router();

// Placeholder for sync endpoints if needed
router.post('/', (req, res) => {
  // Could trigger LAN sync via WebSocket
  res.json({ success: true });
});

export default router;
