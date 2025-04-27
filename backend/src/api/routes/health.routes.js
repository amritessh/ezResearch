const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

//db status check endpoint
router.get('/db', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: dbState === 1 ? 'ok' : 'error',
    database: states[dbState],
    timestamp: new Date().toISOString()
  });
});

//redis status check
router.get('/redis', (req, res) => {
  const redisClient = req.app.get('redisClient');
  if (redisClient && redisClient.isReady) {
    res.status(200).json({
      status: 'ok',
      redis: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
