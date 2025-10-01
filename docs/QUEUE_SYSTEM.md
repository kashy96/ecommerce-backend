# Email Queue System

This e-commerce backend implements a robust background job queue system for email processing using Bull and Redis. This ensures that email operations don't block the main application flow and provides better performance and reliability.

## Overview

The queue system processes the following email types:
- **Order Confirmation** - Sent when an order is placed
- **Order Status Updates** - Sent when order status changes
- **Password Reset** - Sent when user requests password reset
- **Welcome Email** - Sent when new user registers
- **Refund Confirmation** - Sent when order is refunded

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Redis Queue   │───▶│  Email Worker   │
│   (API Server)  │    │    (Bull)       │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │                        │
                               ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Job Storage   │    │  Email Service  │
                       │    (Persist)    │    │   (SMTP/Gmail)  │
                       └─────────────────┘    └─────────────────┘
```

## Components

### 1. QueueService (`services/QueueService.js`)
- Manages job queues and Redis connection
- Provides methods to add email jobs with priorities
- Handles queue statistics and monitoring
- Supports job retry and error handling

### 2. EmailWorker (`workers/emailWorker.js`)
- Background process that consumes email jobs
- Processes different email types with proper error handling
- Can run independently from main application
- Supports graceful shutdown

### 3. Queue Controller (`controllers/queueController.js`)
- Admin interface for queue management
- Provides REST API for monitoring and control
- Supports retry operations and queue statistics

### 4. Queue Routes (`routes/queueRoutes.js`)
- Admin-only routes for queue management
- Endpoints for monitoring, retry, and control operations

## Prerequisites

### Redis Installation

**Windows (using WSL or Docker):**
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Using WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Environment Variables

Add to your `.env` file:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional, leave empty for local development

# Worker Health Check (Optional)
WORKER_HEALTH_CHECK_PORT=3001

# Email Configuration (already configured)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FROM_NAME=ModernShop
```

## Usage

### Development Mode
Run both the API server and email worker:
```bash
npm run dev:all
```

Or run them separately:
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Email Worker
npm run worker:dev
```

### Production Mode
```bash
# Start API Server
npm start

# Start Email Worker (in separate process/container)
npm run worker
```

### Docker Deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    command: npm start
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis

  worker:
    build: .
    command: npm run worker
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis
```

## Queue Management API

### Admin Endpoints (requires admin authentication)

#### Get Queue Dashboard
```http
GET /api/queue/dashboard
```
Returns overview of queue health and statistics.

#### Get Queue Statistics
```http
GET /api/queue/stats
```
Returns detailed queue statistics (waiting, active, completed, failed jobs).

#### Get Failed Jobs
```http
GET /api/queue/failed-jobs?page=1&limit=10
```
Returns paginated list of failed jobs with error details.

#### Retry Specific Job
```http
POST /api/queue/retry-job/:jobId
```
Retries a specific failed job.

#### Retry All Failed Jobs
```http
POST /api/queue/retry-all-failed
```
Retries all failed jobs in the queue.

#### Queue Control
```http
POST /api/queue/pause    # Pause job processing
POST /api/queue/resume   # Resume job processing
POST /api/queue/clean    # Clean old completed/failed jobs
```

#### Test Email (Development Only)
```http
POST /api/queue/test-email
{
  "type": "welcome",
  "email": "test@example.com",
  "priority": 1
}
```

## Job Priorities

- **Priority 1** (High): Order confirmations, password resets
- **Priority 2** (Medium): Order status updates, refund confirmations
- **Priority 3** (Low): Welcome emails, promotional emails

## Error Handling

### Retry Logic
- Jobs are automatically retried up to 3 times
- Exponential backoff starting at 2 seconds
- Failed jobs are preserved for manual investigation

### Monitoring
- Failed jobs are logged with detailed error information
- Queue statistics are available via API
- Health check endpoint for worker process

### Graceful Degradation
- If Redis is unavailable, emails are skipped (not queued)
- Order processing continues even if email queueing fails
- Worker can be restarted without losing queued jobs

## Performance Considerations

### Concurrency
- Email worker processes up to 5 jobs concurrently
- Configurable based on SMTP provider limits

### Memory Management
- Completed jobs are automatically cleaned (keeps last 50)
- Failed jobs are kept (last 100) for investigation
- Periodic cleanup removes old job data

### Scaling
- Multiple worker processes can be run for higher throughput
- Redis cluster support for high availability
- Worker processes can run on separate servers

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis status
   redis-cli ping
   # Should return: PONG
   ```

2. **Jobs Not Processing**
   - Verify worker is running: `ps aux | grep worker`
   - Check worker logs for errors
   - Verify Redis connectivity

3. **High Failed Job Count**
   - Check email service configuration
   - Verify SMTP credentials
   - Review failed job error messages via API

4. **Memory Issues**
   - Increase cleanup frequency
   - Reduce job retention counts
   - Monitor Redis memory usage

### Monitoring Commands

```bash
# Check queue statistics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:5000/api/queue/stats

# View recent failed jobs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:5000/api/queue/failed-jobs

# Health check (if enabled)
curl http://localhost:3001/health
```

## Security Considerations

- Queue management endpoints require admin authentication
- Redis should be secured in production (password, firewall)
- Email credentials should be properly secured
- Worker process should run with minimal privileges

## Integration with Services

The queue system is integrated into the following services:

### OrderService
- `createOrder()` - Queues order confirmation email
- `updateOrderStatus()` - Queues status update email
- `refundOrder()` - Queues refund confirmation email

### UserService
- `registerUser()` - Queues welcome email
- `forgotPassword()` - Queues password reset email

All email operations are now non-blocking and processed in the background, significantly improving the user experience and application performance.