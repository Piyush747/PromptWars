import express from 'express';

const router = express.Router();

// A simple and robust liveness generic health probe endpoint
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
