// backend/src/workers/paperProcessor.js
const { paperProcessingQueue } = require('../services/queue/queueService');
const {
  processPaper
} = require('../api/controllers/paperProcessingController');

// Process paper job
paperProcessingQueue.process('process-paper', async job => {
  try {
    // Update progress
    job.progress(10);

    const { paperId } = job.data;
    console.log(`Starting processing of paper ${paperId}`);

    // Process the paper
    const result = await processPaper(paperId);

    // Update progress
    job.progress(100);

    console.log(`Completed processing of paper ${paperId}`);
    return result;
  } catch (error) {
    console.error('Paper processing worker error:', error);
    throw error;
  }
});

console.log('Paper processing worker started');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down');
  await paperProcessingQueue.close();
  process.exit(0);
});
