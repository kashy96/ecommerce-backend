const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create reusable transporter object
    let transporter;

    // Use SMTP configuration for Mailtrap in development
    if (process.env.EMAIL_SERVICE === 'smtp') {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Default service-based configuration (Gmail, etc.)
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Setup email data
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'E-Commerce Store'}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || null
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Email could not be sent');
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (order, userEmail) => {
  try {
    const itemsList = order.items.map(item =>
      `<li>${item.name} - Quantity: ${item.quantity} - Price: Rs. ${item.price}</li>`
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> Rs. ${order.total}</p>
          <p><strong>Payment Method:</strong> ${order.payment.method.toUpperCase()}</p>
        </div>

        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
          <h3>Items Ordered</h3>
          <ul style="list-style-type: none; padding: 0;">
            ${itemsList}
          </ul>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.address}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p>Thank you for your order!</p>
          <p style="color: #666; font-size: 14px;">
            We'll send you another email when your order ships.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: userEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: html
    });

    return true;
  } catch (error) {
    console.error('Order confirmation email error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendOrderConfirmation
};