# Quick Production Setup Guide

## For Deployment to Production Server

### Step 1: Copy Production Configuration

When deploying to your production server, use the `.env.production` file:

```bash
cp .env.production .env
```

### Step 2: Update These Values

Open `.env` and update:

```env
# Your production domain
FRONTEND_URL=https://girlievogue.com

# Your production MongoDB (use MongoDB Atlas for cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/modern_ecom

# Email settings (already configured for your cPanel email)
EMAIL_SERVICE=smtp
EMAIL_HOST=mail.girlievogue.com
EMAIL_PORT=465
EMAIL_USER=contact@girlievogue.com
EMAIL_PASS=SB^AeI%GUtH0Sh)l
FROM_NAME=Girlievogue
SUPPORT_EMAIL=contact@girlievogue.com

# Your actual Easypaisa credentials
EASYPAISA_STORE_ID=your_actual_store_id
EASYPAISA_SECRET_KEY=your_actual_secret_key
```

### Step 3: Install and Start

```bash
# Install dependencies
npm install --production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "girlievogue-backend"
pm2 save
pm2 startup
```

## Email Configuration Summary

### Development (Local Testing)
✅ **Currently Active** - Mailtrap (in your current `.env`)
- All emails caught by Mailtrap inbox
- No real emails sent to customers
- Perfect for testing

### Production (Live Server)
✅ **Ready to Use** - cPanel Email (in `.env.production`)
- Real emails sent from contact@girlievogue.com
- Will work when deployed to production server
- Uses SSL on port 465

## File Structure

```
ecommerce-backend/
├── .env                    # Current config (Mailtrap for dev)
├── .env.production        # Production config (cPanel email)
├── .env.example           # Template with all options
├── DEPLOYMENT.md          # Full deployment guide
└── PRODUCTION_SETUP.md    # This file (quick reference)
```

## Important Notes

1. **Never commit `.env` files to Git** - they contain secrets
2. **The cPanel email only works on production server** - not locally
3. **Keep using Mailtrap locally** for development and testing
4. **Test emails thoroughly** after deploying to production

## Troubleshooting on Production

If emails don't work after deployment:

### Check 1: Verify SMTP Connection
```bash
telnet mail.girlievogue.com 465
```

### Check 2: Check Application Logs
```bash
pm2 logs girlievogue-backend
```

### Check 3: Test Email Service
Look for this log when server starts:
```
📧 Email Configuration: {
  host: 'mail.girlievogue.com',
  port: 465,
  secure: true,
  user: 'contact@girlievogue.com'
}
```

### Alternative: Use Gmail Instead

If cPanel email has issues, switch to Gmail:

1. Generate Gmail App Password
2. Update `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Quick Commands Reference

```bash
# Development (local)
npm run dev              # Start development server

# Production
npm start                # Start production server
pm2 start server.js      # Start with PM2
pm2 restart girlievogue-backend
pm2 logs girlievogue-backend
pm2 status

# Database
mongosh                  # Connect to MongoDB

# Redis (email queue)
redis-cli
> KEYS email:*          # View email queue
```

## Support

For detailed deployment instructions, see `DEPLOYMENT.md`

For issues:
1. Check application logs
2. Verify all environment variables
3. Test email service separately
4. Check firewall/port settings on server
