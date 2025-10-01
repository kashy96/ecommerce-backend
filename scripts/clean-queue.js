#!/usr/bin/env node

require('dotenv').config();
const QueueService = require('../services/QueueService');

async function cleanQueue() {
  try {
    console.log('🧹 Cleaning email queue...');

    const queueService = new QueueService();

    // Clean failed and completed jobs
    await queueService.emailQueue.clean(0, 'failed');
    await queueService.emailQueue.clean(0, 'completed');

    console.log('✅ Queue cleaned successfully');

    // Get queue stats
    const stats = await queueService.getQueueStats();
    console.log('📊 Current queue stats:', stats);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning queue:', error);
    process.exit(1);
  }
}

cleanQueue();