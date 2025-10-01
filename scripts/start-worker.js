#!/usr/bin/env node

/**
 * Email Worker Startup Script
 *
 * This script starts the email processing worker in the background.
 * It can be run independently from the main application server.
 *
 * Usage:
 *   node scripts/start-worker.js
 *   npm run worker
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailWorker = require('../workers/emailWorker');

// Setup process error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Connect to MongoDB first
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 MongoDB connected for worker');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Start the email worker
async function startWorker() {
  console.log('Starting email worker...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
  console.log('Redis Host:', process.env.REDIS_HOST || '127.0.0.1');
  console.log('Redis Port:', process.env.REDIS_PORT || 6379);

  try {
    await connectDatabase();
    const emailWorker = new EmailWorker();

    console.log('✅ Email worker started successfully');
    console.log('📧 Ready to process email jobs...');

    // Health check endpoint (optional)
    if (process.env.WORKER_HEALTH_CHECK_PORT) {
      const express = require('express');
      const app = express();

      app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
      });

      const port = process.env.WORKER_HEALTH_CHECK_PORT;
      app.listen(port, () => {
        console.log(`📊 Worker health check endpoint running on port ${port}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to start email worker:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();