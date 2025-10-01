const BaseService = require('./BaseService');
const OrderRepository = require('../repositories/OrderRepository');
const ProductService = require('./ProductService');
const CouponService = require('./CouponService');
const QueueService = require('./QueueService');
const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

class OrderService extends BaseService {
  constructor() {
    const orderRepository = new OrderRepository();
    super(orderRepository);
    this.productService = new ProductService();
    this.couponService = new CouponService();
    this.queueService = new QueueService();
  }

  async createOrder(orderData, userId = null) {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      easypaisaDetails,
      couponCode,
      guestEmail
    } = orderData;

    // Validate required fields
    this._validateOrderData(orderData);

    // Validate and process items
    const processedItems = await this._validateAndProcessItems(items);

    // Calculate totals
    const subtotal = processedItems.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );

    const shippingCost = subtotal > 2000 ? 0 : 200;
    const tax = Math.round(subtotal * 0.02); // 2% tax

    let discountAmount = 0;
    let usedCoupon = null;

    // Apply coupon if provided
    if (couponCode && userId) {
      const couponResult = await this.couponService.validateAndUseCoupon(
        couponCode,
        subtotal,
        userId
      );
      discountAmount = couponResult.discountAmount;
      usedCoupon = couponResult.coupon;
    }

    const total = subtotal + shippingCost + tax - discountAmount;

    // Create order
    const orderPayload = {
      items: processedItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      easypaisaDetails: paymentMethod === 'easypaisa' ? easypaisaDetails : undefined,
      subtotal,
      shippingCost,
      tax,
      discountAmount,
      total,
      coupon: usedCoupon,
      status: 'pending'
    };

    // Add user or guest email
    if (userId) {
      orderPayload.user = userId;
    } else if (guestEmail) {
      orderPayload.guestEmail = guestEmail;
    } else {
      throw new ValidationError('Either user ID or guest email is required');
    }

    const order = await this.repository.create(orderPayload);

    // Update product inventory
    await this._updateProductInventory(processedItems);

    // Populate order for response
    const populatedOrder = await this.repository.findById(order._id, 'user items.product');

    // Queue order confirmation email for background processing
    try {
      await this.queueService.queueOrderConfirmationEmail(populatedOrder);
      console.log(`Order confirmation email queued for order ${order._id}`);
    } catch (emailError) {
      console.error('Failed to queue order confirmation email:', emailError);
      // Don't fail the order if email queueing fails
    }

    return populatedOrder;
  }

  async getUserOrders(userId, options = {}) {
    return await this.repository.findUserOrders(userId, options);
  }

  async getOrderById(orderId, userId = null) {
    let order;

    // if (userId) {
    //   // Authenticated user accessing their own order
    //   order = await this.repository.findOne(
    //     { _id: orderId, user: userId },
    //     'user items.product'
    //   );
    // } else {
      // Guest user or admin accessing order
      // For guest users, we allow access to any order by ID
      // In production, you might want to add email verification
      order = await this.repository.findById(orderId, 'user items.product');
    // }

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId, newStatus, updatedBy = null, note = null) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError('Invalid order status');
    }

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate status transitions
    this._validateStatusTransition(order.status, newStatus);

    // Handle inventory restoration for cancelled orders
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      await this._restoreProductInventory(order.items);
    }

    const updatedOrder = await this.repository.updateOrderStatus(
      orderId,
      newStatus,
      updatedBy,
      note
    );

    // Queue status update email for background processing
    try {
      await this.queueService.queueOrderStatusUpdateEmail(updatedOrder);
      console.log(`Order status update email queued for order ${orderId}`);
    } catch (emailError) {
      console.error('Failed to queue order status update email:', emailError);
    }

    return updatedOrder;
  }

  async updateOrderStatusAdmin(orderId, newStatus, updatedBy = null, note = null) {
    // Admin version - no user restrictions, can update any order to any valid status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError('Invalid order status');
    }

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Admin can bypass normal status transition rules in emergency cases
    // But still handle inventory for cancelled orders
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      await this._restoreProductInventory(order.items);
    }

    const updatedOrder = await this.repository.updateOrderStatus(
      orderId,
      newStatus,
      updatedBy,
      note
    );

    // Queue status update email for background processing
    try {
      await this.queueService.queueOrderStatusUpdateEmail(updatedOrder);
      console.log(`Order status update email queued for order ${orderId} by admin`);
    } catch (emailError) {
      console.error('Failed to queue order status update email:', emailError);
    }

    return updatedOrder;
  }

  async cancelOrder(orderId, userId) {
    const order = await this.repository.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Users can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestError('Order cannot be cancelled at this stage');
    }

    return await this.updateOrderStatus(orderId, 'cancelled', userId, 'Cancelled by customer');
  }

  async confirmOrder(orderId, userId = null) {
    // Find order (for guest users, userId can be null)
    const filter = userId ? { _id: orderId, user: userId } : { _id: orderId };
    const order = await this.repository.findOne(filter);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Only pending orders can be confirmed
    if (order.status !== 'pending') {
      throw new BadRequestError('Only pending orders can be confirmed');
    }

    return await this.updateOrderStatus(orderId, 'confirmed', userId, 'Order confirmed by customer');
  }

  async processPayment(orderId, paymentDetails) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.payment.status === 'paid') {
      throw new BadRequestError('Order is already paid');
    }

    // Process payment based on method
    if (order.payment.method === 'easypaisa') {
      // In a real app, integrate with Easypaisa API
      await this.repository.updateById(orderId, {
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        'payment.transactionId': paymentDetails.transactionId,
        status: 'confirmed'
      });
    }

    return await this.repository.findById(orderId);
  }

  async getOrderStats() {
    const stats = await this.repository.getOrderStats();
    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };
  }

  async getRevenueByPeriod(period = 'month') {
    return await this.repository.getRevenueByPeriod(period);
  }

  async getTopCustomers(limit = 10) {
    return await this.repository.getTopCustomers(parseInt(limit));
  }

  async getRecentOrders(limit = 10) {
    return await this.repository.getRecentOrders(parseInt(limit));
  }

  async getOrdersByPaymentMethod() {
    return await this.repository.getOrdersByPaymentMethod();
  }

  async searchOrders(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long');
    }

    return await this.repository.searchOrders(searchTerm.trim(), options);
  }

  async getOrdersByStatus(status, options = {}) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid order status');
    }

    return await this.repository.findOrdersByStatus(status, options);
  }

  async getOrdersByDateRange(startDate, endDate, options = {}) {
    return await this.repository.findOrdersByDateRange(startDate, endDate, options);
  }

  async refundOrder(orderId, reason = null) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestError('Only delivered orders can be refunded');
    }

    // Restore inventory
    await this._restoreProductInventory(order.items);

    // Update order status
    const refundedOrder = await this.repository.refundOrder(orderId);

    // Queue refund confirmation email for background processing
    try {
      await this.queueService.queueRefundConfirmationEmail(refundedOrder);
      console.log(`Refund confirmation email queued for order ${orderId}`);
    } catch (emailError) {
      console.error('Failed to queue refund confirmation email:', emailError);
    }

    return refundedOrder;
  }

  // Private helper methods
  _validateOrderData(orderData) {
    const { items, shippingAddress, billingAddress, paymentMethod, guestEmail } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }

    if (!shippingAddress) {
      throw new ValidationError('Shipping address is required');
    }

    if (!billingAddress) {
      throw new ValidationError('Billing address is required');
    }

    if (!paymentMethod || !['cod', 'easypaisa'].includes(paymentMethod)) {
      throw new ValidationError('Valid payment method is required');
    }

    // Validate guest email format if provided
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      throw new ValidationError('Valid email address is required for guest orders');
    }

    // Validate address fields
    const requiredAddressFields = ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode', 'phone'];

    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        throw new ValidationError(`Shipping ${field} is required`);
      }
      if (!billingAddress[field]) {
        throw new ValidationError(`Billing ${field} is required`);
      }
    }
  }

  async _validateAndProcessItems(items) {
    const processedItems = [];

    for (const item of items) {
      const productId = item.product || item.id;
      const quantity = parseInt(item.quantity);

      if (!productId || quantity <= 0) {
        throw new ValidationError('Invalid item data');
      }

      // Get product details
      const product = await this.productService.repository.findById(productId);
      if (!product) {
        throw new ValidationError(`Product not found: ${item.name || productId}`);
      }

      if (!product.isActive) {
        throw new ValidationError(`Product is not available: ${product.name}`);
      }

      // Check inventory
      if (product.inventory && product.inventory.trackQuantity && product.inventory.quantity < quantity) {
        throw new ValidationError(`Insufficient stock for ${product.name}`);
      }

      processedItems.push({
        product: product._id,
        quantity,
        price: product.price,
        selectedVariants: item.selectedVariants || {}
      });
    }

    return processedItems;
  }

  async _updateProductInventory(items) {
    for (const item of items) {
      await this.productService.updateProductInventory(
        item.product,
        item.quantity,
        'subtract'
      );
    }
  }

  async _restoreProductInventory(items) {
    for (const item of items) {
      await this.productService.updateProductInventory(
        item.product,
        item.quantity,
        'add'
      );
    }
  }

  _validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // No transitions from delivered
      cancelled: [] // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestError(`Cannot change status from ${currentStatus} to ${newStatus}`);
    }
  }
}

module.exports = OrderService;