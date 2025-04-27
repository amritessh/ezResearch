// backend/src/services/queue/queueService.js
const Queue = require('bull');
const Redis = require('ioredis');
const config = require('../../config');

// Create Redis client
const redisClient = new Redis(config.redisUrl);

// Create queues
const paperProcessingQueue = new Queue('paper-processing', {
  redis: {
    port: redisClient.connector.options.port,
    host: redisClient.connector.options.host,
    password: redisClient.connector.options.password
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 100 // Keep last 100 failed jobs
  }
});

// Queue event handlers
paperProcessingQueue.on('error', error => {
  console.error('Paper processing queue error:', error);
});

paperProcessingQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

const queuePaperProcessing = async paperId => {
  return await paperProcessingQueue.add('process-paper', { paperId });
};

const getJobStatus = async jobId => {
  const job = await paperProcessingQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    id: job.id,
    data: job.data,
    state,
    progress: job.progress,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn
  };
};

module.exports = {
  paperProcessingQueue,
  queuePaperProcessing,
  getJobStatus
};
