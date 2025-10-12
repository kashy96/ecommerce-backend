const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this._createTransporter();
  }

  _createTransporter() {
    // Use SMTP configuration for Mailtrap in development
    if (process.env.EMAIL_SERVICE === 'smtp') {
      const port = parseInt(process.env.EMAIL_PORT || '587');
      const isSecure = port === 465;

      const config = {
        host: process.env.EMAIL_HOST,
        port: port,
        secure: isSecure, // true for 465, false for other ports (587, 2525)
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        },
        // Additional debugging and connection settings
        logger: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development',
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
      };

      // For non-secure ports (587), explicitly enable STARTTLS
      if (!isSecure) {
        config.requireTLS = true;
      }

      console.log('📧 Email Configuration:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user
      });

      return nodemailer.createTransport(config);
    }

    // Default service-based configuration (Gmail, etc.)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'ModernShop'}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || null
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email error:', error);
      throw new Error('Email could not be sent');
    }
  }

  async sendOrderConfirmationEmail(order) {
    const itemsList = order.items.map(item =>
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product?.name || item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
          </div>

          <!-- Order Details -->
          <div style="padding: 30px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #333; margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> Rs. ${order.total.toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
            </div>

            <!-- Items -->
            <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <!-- Order Summary -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
                  <td style="text-align: right; padding: 5px 0;">Rs. ${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Shipping:</strong></td>
                  <td style="text-align: right; padding: 5px 0;">${order.shippingCost === 0 ? 'Free' : `Rs. ${order.shippingCost}`}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Tax:</strong></td>
                  <td style="text-align: right; padding: 5px 0;">Rs. ${order.tax}</td>
                </tr>
                ${order.discountAmount > 0 ? `
                <tr style="color: #28a745;">
                  <td style="padding: 5px 0;"><strong>Discount:</strong></td>
                  <td style="text-align: right; padding: 5px 0;">-Rs. ${order.discountAmount.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #dee2e6; font-size: 18px; font-weight: bold;">
                  <td style="padding: 10px 0;"><strong>Total:</strong></td>
                  <td style="text-align: right; padding: 10px 0; color: #667eea;">Rs. ${order.total.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Shipping Address -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
              <p style="margin: 5px 0;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.addressLine1}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
            </div>

            <!-- What's Next -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin-top: 0;">What's Next?</h3>
              <p style="margin: 10px 0;">We'll prepare your order and send you tracking information once it ships.</p>
              <p style="margin: 10px 0;"><strong>Estimated Delivery:</strong> 3-5 business days</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">Thank you for shopping with ModernShop!</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Need help? Contact us at support@modernshop.com or +92 300 1234567
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const email = order.user?.email || order.guestEmail;
    if (!email) {
      throw new Error('No email address found for order confirmation');
    }

    return await this.sendEmail({
      email: email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html
    });
  }

  async sendOrderStatusUpdateEmail(order) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered. Thank you for shopping with us!',
      cancelled: 'Your order has been cancelled.'
    };

    const statusColors = {
      confirmed: '#007bff',
      processing: '#ffc107',
      shipped: '#6f42c1',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: ${statusColors[order.status]}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order ${order.orderNumber}</p>
          </div>

          <!-- Status Update -->
          <div style="padding: 30px; text-align: center;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: ${statusColors[order.status]}; margin-top: 0; font-size: 28px; text-transform: capitalize;">
                ${order.status}
              </h2>
              <p style="font-size: 16px; color: #666; margin: 0;">
                ${statusMessages[order.status]}
              </p>
            </div>

            <!-- Order Details -->
            <div style="text-align: left; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0;">Order Information</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> Rs. ${order.total.toLocaleString()}</p>
              ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">Thank you for shopping with ModernShop!</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Questions? Contact us at support@modernshop.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const email = order.user?.email || order.guestEmail;
    if (!email) {
      throw new Error('No email address found for order status update');
    }

    return await this.sendEmail({
      email: email,
      subject: `Order Update - ${order.orderNumber} is ${order.status}`,
      html
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your ModernShop account. Click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${resetUrl}
            </p>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong></p>
              <ul style="margin: 10px 0 0 0; color: #856404;">
                <li>This link will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you click the link above</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">ModernShop Security Team</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Need help? Contact us at support@modernshop.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      email,
      subject: 'Password Reset Request - ModernShop',
      html
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ModernShop</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to ModernShop!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for joining us</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333;">Hello ${user.name}!</h2>
            <p>Welcome to ModernShop! We're excited to have you as part of our community.</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
              <ul style="color: #666;">
                <li>Browse our extensive product catalog</li>
                <li>Add items to your wishlist</li>
                <li>Enjoy free shipping on orders over Rs. 2000</li>
                <li>Get exclusive member discounts</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Start Shopping
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">Happy shopping!</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Questions? Contact us at support@modernshop.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      email: user.email,
      subject: 'Welcome to ModernShop!',
      html
    });
  }

  async sendRefundConfirmationEmail(order) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: #28a745; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Refund Processed</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order ${order.orderNumber}</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333;">Your refund has been processed</h2>
            <p>We have successfully processed your refund for order ${order.orderNumber}.</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Refund Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Refund Amount:</strong> Rs. ${order.total.toLocaleString()}</p>
              <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Expected in Account:</strong> 3-5 business days</p>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px;">
              <p style="margin: 0; color: #155724;">
                <strong>Note:</strong> The refund will be credited to your original payment method within 3-5 business days.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">Thank you for shopping with ModernShop!</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Questions? Contact us at support@modernshop.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const email = order.user?.email || order.guestEmail;
    if (!email) {
      throw new Error('No email address found for refund confirmation');
    }

    return await this.sendEmail({
      email: email,
      subject: `Refund Processed - ${order.orderNumber}`,
      html
    });
  }

  async sendContactConfirmationEmail(submission) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">ModernShop</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for contacting us!</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Message Has Been Received</h2>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #667eea; margin-top: 0;">Submission Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Ticket ID:</td><td style="color: #667eea; font-weight: bold;">${submission.ticketId}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>${submission.name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${submission.email}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Category:</td><td style="text-transform: capitalize;">${submission.category}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="text-transform: capitalize;">${submission.priority}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Subject:</td><td>${submission.subject}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Submitted:</td><td>${new Date(submission.submittedAt).toLocaleString()}</td></tr>
              </table>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #667eea; margin-top: 0;">Your Message</h3>
              <p style="line-height: 1.6; margin: 0; white-space: pre-wrap;">${submission.message}</p>
            </div>

            <div style="background: #e8f2ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Our support team will review your message</li>
                <li>You'll receive a response within 24 hours</li>
                <li>For urgent matters, call us at +92 300 1234567</li>
                <li>Please save your ticket ID: <strong style="color: #667eea;">${submission.ticketId}</strong></li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666;">© 2025 ModernShop. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Need immediate help? Contact us at support@modernshop.com or +92 300 1234567
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      email: submission.email,
      subject: `Thank you for contacting ModernShop - Ticket #${submission.ticketId}`,
      html
    });
  }

  async sendContactNotificationEmail(submission) {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };

    const categoryIcons = {
      general: '💬',
      support: '🛠️',
      complaint: '⚠️',
      order: '📦',
      shipping: '🚚',
      payment: '💳',
      returns: '↩️',
      partnership: '🤝',
      feedback: '💭'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Submission</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: #1f2937; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔔 New Contact Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${submission.ticketId}</p>
          </div>

          <!-- Priority & Category -->
          <div style="padding: 20px; background: #f8f9fa; text-align: center;">
            <div style="display: inline-block; margin-right: 10px;">
              <span style="background: ${priorityColors[submission.priority] || '#6b7280'}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${submission.priority} Priority
              </span>
            </div>
            <div style="display: inline-block;">
              <span style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: capitalize;">
                ${categoryIcons[submission.category] || '📄'} ${submission.category}
              </span>
            </div>
          </div>

          <!-- Customer Information -->
          <div style="padding: 30px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">👤 Customer Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td><td>${submission.name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td><a href="mailto:${submission.email}" style="color: #667eea; text-decoration: none;">${submission.email}</a></td></tr>
                ${submission.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td><a href="tel:${submission.phone}" style="color: #667eea; text-decoration: none;">${submission.phone}</a></td></tr>` : ''}
                <tr><td style="padding: 8px 0; font-weight: bold;">Submitted:</td><td>${new Date(submission.submittedAt).toLocaleString()}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td><span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${submission.status}</span></td></tr>
              </table>
            </div>

            <!-- Subject -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">📝 Subject</h3>
              <p style="font-weight: bold; margin: 0; font-size: 16px;">${submission.subject}</p>
            </div>

            <!-- Message -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">💬 Message</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
                <p style="line-height: 1.6; margin: 0; white-space: pre-wrap;">${submission.message}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${submission.email}?subject=Re: ${submission.subject} (Ticket #${submission.ticketId})" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; display: inline-block;">
                📧 Reply to Customer
              </a>
              ${submission.phone ? `<a href="tel:${submission.phone}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📞 Call Customer</a>` : ''}
            </div>

            <!-- Response Time Notice -->
            ${submission.priority === 'urgent' ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #b91c1c;"><strong>⚡ URGENT:</strong> This ticket requires immediate attention. Please respond within 2 hours.</p>
            </div>
            ` : `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #166534;"><strong>📅 Response Target:</strong> Please respond within 24 hours to maintain our service standards.</p>
            </div>
            `}
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #666; font-size: 14px;">ModernShop Support Team</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
              This notification was sent to ${process.env.SUPPORT_EMAIL || 'support@modernshop.com'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      email: process.env.SUPPORT_EMAIL || 'support@modernshop.com',
      subject: `🚨 New ${submission.priority.toUpperCase()} priority ${submission.category} inquiry - #${submission.ticketId}`,
      html
    });
  }
}

module.exports = EmailService;