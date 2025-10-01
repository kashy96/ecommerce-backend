const express = require('express');
const {
  getQueueStats,
  getFailedJobs,
  retryJob,
  retryAllFailedJobs,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  getQueueDashboard,
  addTestEmailJob
} = require('../controllers/queueController');

const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { commonValidation } = require('../middleware/validationSchemas');

const router = express.Router();

// All queue routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Queue dashboard - overview of all queue statistics
router.get('/dashboard', getQueueDashboard);

// Queue statistics
router.get('/stats', getQueueStats);

// Failed jobs management
router.get('/failed-jobs', ...commonValidation.pagination, handleValidationErrors, getFailedJobs);
router.post('/retry-job/:id', ...commonValidation.mongoId, handleValidationErrors, retryJob);
router.post('/retry-all-failed', retryAllFailedJobs);

// Queue control
router.post('/pause', pauseQueue);
router.post('/resume', resumeQueue);
router.post('/clean', cleanQueue);

// Test email (development/testing purposes)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-email', addTestEmailJob);
}

module.exports = router;