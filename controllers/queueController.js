const QueueService = require('../services/QueueService');
const { asyncHandler } = require('../middleware/validation');

const queueService = new QueueService();

// Get queue statistics
exports.getQueueStats = asyncHandler(async (req, res) => {
  const stats = await queueService.getQueueStats();

  res.status(200).json({
    success: true,
    stats
  });
});

// Get failed jobs
exports.getFailedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit) - 1;

  const failedJobs = await queueService.getFailedJobs(start, end);

  const jobsData = failedJobs.map(job => ({
    id: job.id,
    type: job.name,
    data: job.data,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    attemptsMade: job.attemptsMade,
    opts: job.opts
  }));

  res.status(200).json({
    success: true,
    failedJobs: jobsData,
    pagination: {
      current: parseInt(page),
      limit: parseInt(limit),
      total: failedJobs.length
    }
  });
});

// Retry specific job
exports.retryJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const success = await queueService.retryJob(jobId);

  if (success) {
    res.status(200).json({
      success: true,
      message: `Job ${jobId} has been retried`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Job ${jobId} not found or could not be retried`
    });
  }
});

// Retry all failed jobs
exports.retryAllFailedJobs = asyncHandler(async (req, res) => {
  const retriedCount = await queueService.retryAllFailedJobs();

  res.status(200).json({
    success: true,
    message: `${retriedCount} failed jobs have been retried`
  });
});

// Pause queue
exports.pauseQueue = asyncHandler(async (req, res) => {
  await queueService.pauseQueue();

  res.status(200).json({
    success: true,
    message: 'Email queue has been paused'
  });
});

// Resume queue
exports.resumeQueue = asyncHandler(async (req, res) => {
  await queueService.resumeQueue();

  res.status(200).json({
    success: true,
    message: 'Email queue has been resumed'
  });
});

// Clean queue
exports.cleanQueue = asyncHandler(async (req, res) => {
  await queueService.cleanQueue();

  res.status(200).json({
    success: true,
    message: 'Email queue has been cleaned'
  });
});

// Get queue dashboard data
exports.getQueueDashboard = asyncHandler(async (req, res) => {
  const [stats, failedJobs] = await Promise.all([
    queueService.getQueueStats(),
    queueService.getFailedJobs(0, 5) // Get latest 5 failed jobs
  ]);

  const recentFailures = failedJobs.map(job => ({
    id: job.id,
    type: job.name,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    attemptsMade: job.attemptsMade
  }));

  res.status(200).json({
    success: true,
    dashboard: {
      stats,
      recentFailures,
      isHealthy: stats && stats.failed < 10, // Consider healthy if less than 10 failed jobs
      lastUpdated: new Date()
    }
  });
});

// Add test email job (for testing purposes)
exports.addTestEmailJob = asyncHandler(async (req, res) => {
  const { type = 'welcome', email = 'test@example.com', priority = 1 } = req.body;

  let job;
  switch (type) {
    case 'welcome':
      job = await queueService.queueWelcomeEmail({
        email,
        name: 'Test User'
      }, priority);
      break;
    case 'passwordReset':
      job = await queueService.queuePasswordResetEmail(email, 'test-token', priority);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid email type'
      });
  }

  res.status(201).json({
    success: true,
    message: `Test ${type} email job created`,
    jobId: job.id
  });
});

module.exports = {
  getQueueStats: exports.getQueueStats,
  getFailedJobs: exports.getFailedJobs,
  retryJob: exports.retryJob,
  retryAllFailedJobs: exports.retryAllFailedJobs,
  pauseQueue: exports.pauseQueue,
  resumeQueue: exports.resumeQueue,
  cleanQueue: exports.cleanQueue,
  getQueueDashboard: exports.getQueueDashboard,
  addTestEmailJob: exports.addTestEmailJob
};