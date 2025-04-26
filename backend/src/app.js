
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const healthRoutes = require('./api/routes/health.routes');
const userRoutes = require('./api/routes/user.routes');
const paperRoutes = require('./api/routes/paper.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/paperexplainer'
    );
  } catch (error) {
    console.error('MongoDB connection error:', error);

    setTimeout(connectDB, 5000);
  }
};

const connectRedis = async () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', err => {
    console.error('Redis connection error:', err);
  });

  await redisClient.connect();
  console.log('Redis connected successfully');

  return redisClient;
};

connectDB();
let redisClient;
(async () => {
  redisClient = await connectRedis();
  app.set('redisClient', redisClient);
})();

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/papers', paperRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
