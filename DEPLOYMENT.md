# Production Deployment Guide

This guide will help you deploy the Modern E-commerce backend to production.

## Prerequisites

- Node.js 16+ installed on production server
- MongoDB database (local or MongoDB Atlas)
- Redis server (for email queue)
- Domain name with email configured (cPanel or other)

## Deployment Steps

### 1. Environment Configuration

Copy the production environment template:

```bash
cp .env.production .env
```

Then update the following values in `.env`:

#### Required Updates:

**Database:**
```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/modern_ecom_production

# OR for MongoDB Atlas (recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/modern_ecom
```

**Frontend URL:**
```env
FRONTEND_URL=https://yourdomain.com
```

**Email Configuration:**
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_USER=contact@yourdomain.com
EMAIL_PASS=your_actual_email_password
FROM_NAME=YourStoreName
SUPPORT_EMAIL=contact@yourdomain.com
```

**Payment Gateway:**
```env
EASYPAISA_STORE_ID=your_actual_store_id
EASYPAISA_SECRET_KEY=your_actual_secret_key
```

**Redis (if using external Redis):**
```env
REDIS_HOST=your_redis_host
REDIS_PORT=6379
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Test Email Configuration

Before going live, test your email configuration:

```bash
# Start the server
npm start

# In another terminal, test sending an email
# (You can place a test order or trigger any email-sending action)
```

Check your email inbox and spam folder to confirm emails are being sent.

### 4. Start Production Server

#### Option A: Using PM2 (Recommended)

PM2 keeps your app running and auto-restarts on crashes:

```bash
# Install PM2 globally
npm install -g pm2

# Start the app with PM2
pm2 start server.js --name "ecommerce-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status              # View app status
pm2 logs                # View logs
pm2 restart ecommerce-backend
pm2 stop ecommerce-backend
```

#### Option B: Using systemd (Linux)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/ecommerce-backend.service
```

Add:
```ini
[Unit]
Description=E-commerce Backend
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/ecommerce-backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ecommerce-backend
sudo systemctl start ecommerce-backend
sudo systemctl status ecommerce-backend
```

### 5. Setup Nginx Reverse Proxy (Optional but Recommended)

Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/ecommerce-backend
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/ecommerce-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL (HTTPS)

Using Let's Encrypt (free):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Email Configuration Troubleshooting

### If cPanel Email Doesn't Work:

#### Option 1: Use Gmail (Quick Setup)

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password: Google Account → Security → App Passwords
3. Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

#### Option 2: Use SendGrid (Professional)

1. Sign up at https://sendgrid.com (100 emails/day free)
2. Create an API key
3. Update `.env`:

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

#### Option 3: Contact Your Hosting Provider

Ask them about:
- Correct SMTP port (465 or 587)
- Whether SSL/TLS is required
- Any firewall restrictions
- Whitelist your server IP for SMTP access

## Monitoring

### Check Application Logs

```bash
# If using PM2
pm2 logs ecommerce-backend

# If using systemd
sudo journalctl -u ecommerce-backend -f
```

### Monitor Email Queue

The app uses Redis for email queuing. Monitor it with:

```bash
redis-cli
> KEYS email:*
> LLEN email:queue
```

### Health Check Endpoint

Test if your API is running:

```bash
curl http://localhost:5000/api/health
# or
curl https://api.yourdomain.com/api/health
```

## Security Checklist

- [ ] Changed JWT_SECRET to a strong random string
- [ ] Updated all default passwords
- [ ] Enabled HTTPS/SSL
- [ ] Configured CORS for your frontend domain
- [ ] Set up firewall (only allow necessary ports)
- [ ] Regular backups of MongoDB database
- [ ] Keep Node.js and dependencies updated
- [ ] Set up monitoring/alerting

## Common Issues

### Email not sending

1. Check logs for email errors
2. Verify email credentials are correct
3. Test with Mailtrap first
4. Check firewall/port restrictions
5. Try alternative email service (Gmail/SendGrid)

### Database connection errors

1. Check MongoDB is running: `sudo systemctl status mongodb`
2. Verify MONGODB_URI is correct
3. Check network connectivity
4. Ensure database user has correct permissions

### Redis connection errors

1. Check Redis is running: `sudo systemctl status redis`
2. Verify REDIS_HOST and REDIS_PORT
3. Check firewall settings

## Scaling Tips

1. **Database**: Use MongoDB Atlas for managed, scalable database
2. **Email**: Use SendGrid or AWS SES for high-volume emails
3. **Redis**: Use Redis Cloud for managed Redis
4. **Application**: Deploy multiple instances behind a load balancer
5. **Monitoring**: Set up Datadog, New Relic, or PM2 Plus

## Support

For issues, check:
- Application logs
- Email service documentation
- MongoDB logs
- Redis logs

## Environment Files Summary

- `.env` - Active configuration (don't commit to git)
- `.env.production` - Production template
- `.env.example` - Example with all options

Remember to add `.env` to `.gitignore`!
