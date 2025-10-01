const QueueService = require('../services/QueueService');
const EmailService = require('../services/EmailService');

class EmailWorker {
  constructor() {
    this.queueService = new QueueService();
    this.emailService = new EmailService();
    this.setupProcessors();
  }

  setupProcessors() {
    // Process email jobs with concurrency of 5
    this.queueService.emailQueue.process('*', 5, async (job) => {
      return this.processEmailJob(job);
    });

    // Add debug listeners
    this.queueService.emailQueue.on('waiting', (jobId) => {
      console.log(`📧 Job ${jobId} is waiting to be processed`);
    });

    this.queueService.emailQueue.on('active', (job) => {
      console.log(`📧 Job ${job.id} started processing`);
    });

    this.queueService.emailQueue.on('completed', (job, result) => {
      console.log(`📧 Job ${job.id} completed successfully`);
    });

    this.queueService.emailQueue.on('failed', (job, err) => {
      console.error(`📧 Job ${job.id} failed:`, err.message);
    });

    console.log('Email worker started and ready to process jobs');
  }

  async processEmailJob(job) {
    const type = job.name; // Job type is stored in job.name
    const data = job.data; // Job data is in job.data

    try {
      job.progress(10); // Job started
      console.log(`Processing email job ${job.id}: ${type}`);

      let result;

      switch (type) {
        case 'orderConfirmation':
          result = await this.handleOrderConfirmation(job, data);
          break;

        case 'orderStatusUpdate':
          result = await this.handleOrderStatusUpdate(job, data);
          break;

        case 'passwordReset':
          result = await this.handlePasswordReset(job, data);
          break;

        case 'welcome':
          result = await this.handleWelcomeEmail(job, data);
          break;

        case 'refundConfirmation':
          result = await this.handleRefundConfirmation(job, data);
          break;

        default:
          throw new Error(`Unknown email job type: ${type}`);
      }

      job.progress(100); // Job completed
      console.log(`Email job ${job.id} completed successfully`);
      return result;

    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleOrderConfirmation(job, data) {
    job.progress(30);

    const { orderData } = data;

    try {
      await this.emailService.sendOrderConfirmationEmail(orderData);

      // Try to update order to mark email as sent (non-critical)
      try {
        const OrderService = require('../services/OrderService');
        const orderService = new OrderService();
        await orderService.repository.updateById(orderData._id, { emailSent: true });
        console.log(`✅ Order ${orderData._id} marked as email sent`);
      } catch (updateError) {
        // Don't fail the email job if we can't update the database
        console.warn(`⚠️ Could not update emailSent status for order ${orderData._id}:`, updateError.message);
      }

      return {
        success: true,
        message: 'Order confirmation email sent successfully',
        orderId: orderData._id,
        email: data.userEmail
      };
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      throw new Error(`Order confirmation email failed: ${error.message}`);
    }
  }

  async handleOrderStatusUpdate(job, data) {
    job.progress(30);

    const { orderData } = data;

    try {
      await this.emailService.sendOrderStatusUpdateEmail(orderData);

      return {
        success: true,
        message: 'Order status update email sent successfully',
        orderId: orderData._id,
        email: data.userEmail,
        status: orderData.status
      };
    } catch (error) {
      console.error('Failed to send order status update email:', error);
      throw new Error(`Order status update email failed: ${error.message}`);
    }
  }

  async handlePasswordReset(job, data) {
    job.progress(30);

    const { email, resetToken } = data;

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);

      return {
        success: true,
        message: 'Password reset email sent successfully',
        email
      };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(`Password reset email failed: ${error.message}`);
    }
  }

  async handleWelcomeEmail(job, data) {
    job.progress(30);

    const { email, name } = data;

    try {
      await this.emailService.sendWelcomeEmail(email, name);

      return {
        success: true,
        message: 'Welcome email sent successfully',
        email,
        name
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error(`Welcome email failed: ${error.message}`);
    }
  }

  async handleRefundConfirmation(job, data) {
    job.progress(30);

    const { orderData } = data;

    try {
      await this.emailService.sendRefundConfirmationEmail(orderData);

      return {
        success: true,
        message: 'Refund confirmation email sent successfully',
        orderId: orderData._id,
        email: data.userEmail
      };
    } catch (error) {
      console.error('Failed to send refund confirmation email:', error);
      throw new Error(`Refund confirmation email failed: ${error.message}`);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down email worker...');
    await this.queueService.closeQueue();
    console.log('Email worker shut down complete');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down email worker...');
  if (global.emailWorker) {
    await global.emailWorker.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down email worker...');
  if (global.emailWorker) {
    await global.emailWorker.shutdown();
  }
  process.exit(0);
});

// Create and start the worker if this file is run directly
if (require.main === module) {
  global.emailWorker = new EmailWorker();
  console.log('Email worker process started');
} else {
  // Export for use in other files
  module.exports = EmailWorker;
}