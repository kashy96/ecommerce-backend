const Queue = require('bull');
const Redis = require('ioredis');

class QueueService {
  constructor() {
    // Redis connection configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    };

    // Initialize queues
    this.emailQueue = new Queue('email processing', {
      redis: {
        ...this.redisConfig,
        lazyConnect: false // Force immediate connection
      },
      defaultJobOptions: {
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100,    // Keep last 100 failed jobs
        attempts: 3,          // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Add connection event listeners for debugging
    this.emailQueue.on('ready', () => {
      console.log('📧 Queue connected and ready');
    });

    this.emailQueue.on('error', (error) => {
      console.error('📧 Queue connection error:', error);
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Email queue events
    this.emailQueue.on('completed', (job, result) => {
      console.log(`Email job ${job.id} completed:`, result);
    });

    this.emailQueue.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err.message);
    });

    this.emailQueue.on('progress', (job, progress) => {
      console.log(`Email job ${job.id} is ${progress}% complete`);
    });

    this.emailQueue.on('stalled', (job) => {
      console.warn(`Email job ${job.id} stalled`);
    });

    // Global error handling
    this.emailQueue.on('error', (error) => {
      console.error('Email queue error:', error);
    });
  }

  // Add email job to queue
  async addEmailJob(type, data, options = {}) {
    try {
      const jobOptions = {
        priority: options.priority || 0,
        delay: options.delay || 0,
        ...options
      };

      const job = await this.emailQueue.add(type, data, jobOptions);
      console.log(`Email job ${job.id} added to queue: ${type}`);
      return job;
    } catch (error) {
      console.error('Failed to add email job to queue:', error);
      throw error;
    }
  }

  // Specific email job methods
  async queueOrderConfirmationEmail(orderData, priority = 1) {
    const userEmail = orderData.user?.email || orderData.guestEmail;

    if (!userEmail) {
      throw new Error('No email address found for order confirmation');
    }

    return this.addEmailJob('orderConfirmation', {
      orderId: orderData._id,
      userEmail,
      orderData
    }, { priority });
  }

  async queueOrderStatusUpdateEmail(orderData, priority = 2) {
    const userEmail = orderData.user?.email || orderData.guestEmail;

    if (!userEmail) {
      throw new Error('No email address found for order status update');
    }

    return this.addEmailJob('orderStatusUpdate', {
      orderId: orderData._id,
      userEmail,
      orderData
    }, { priority });
  }

  async queuePasswordResetEmail(email, resetToken, priority = 1) {
    return this.addEmailJob('passwordReset', {
      email,
      resetToken
    }, { priority });
  }

  async queueWelcomeEmail(userData, priority = 3) {
    return this.addEmailJob('welcome', {
      email: userData.email,
      name: userData.name,
      userData
    }, { priority });
  }

  async queueRefundConfirmationEmail(orderData, priority = 2) {
    const userEmail = orderData.user?.email || orderData.guestEmail;

    if (!userEmail) {
      throw new Error('No email address found for refund confirmation');
    }

    return this.addEmailJob('refundConfirmation', {
      orderId: orderData._id,
      userEmail,
      orderData
    }, { priority });
  }

  // Queue management methods
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async pauseQueue() {
    await this.emailQueue.pause();
    console.log('Email queue paused');
  }

  async resumeQueue() {
    await this.emailQueue.resume();
    console.log('Email queue resumed');
  }

  async cleanQueue() {
    await this.emailQueue.clean(5000, 'completed');
    await this.emailQueue.clean(10000, 'failed');
    console.log('Email queue cleaned');
  }

  async closeQueue() {
    await this.emailQueue.close();
    console.log('Email queue closed');
  }

  // Get failed jobs for retry or investigation
  async getFailedJobs(start = 0, end = 10) {
    try {
      return await this.emailQueue.getFailed(start, end);
    } catch (error) {
      console.error('Failed to get failed jobs:', error);
      return [];
    }
  }

  // Retry specific job
  async retryJob(jobId) {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (job) {
        await job.retry();
        console.log(`Job ${jobId} retried`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  // Retry all failed jobs
  async retryAllFailedJobs() {
    try {
      const failedJobs = await this.emailQueue.getFailed();
      const retryPromises = failedJobs.map(job => job.retry());
      await Promise.all(retryPromises);
      console.log(`Retried ${failedJobs.length} failed jobs`);
      return failedJobs.length;
    } catch (error) {
      console.error('Failed to retry all failed jobs:', error);
      return 0;
    }
  }
}

module.exports = QueueService;