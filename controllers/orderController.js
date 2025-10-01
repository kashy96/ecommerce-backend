const OrderService = require('../services/OrderService');
const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

const orderService = new OrderService();

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const order = await orderService.createOrder(req.body, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);

    if (error instanceof ValidationError || error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const options = { page, limit, status };

    const result = await orderService.getUserOrders(req.user.id, options);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user orders'
    });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const Order = require('../models/Order');

    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalItems: totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting all orders'
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    console.log('userId', userId);
    
    const order = await orderService.getOrderById(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting order'
    });
  }
};

// Update order status (users can cancel or confirm)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const userId = req.user ? req.user.id : null;

    let order;
    let message;

    if (status === 'cancelled') {
      order = await orderService.cancelOrder(orderId, userId);
      message = 'Order cancelled successfully';
    } else if (status === 'confirmed') {
      order = await orderService.confirmOrder(orderId, userId);
      message = 'Order confirmed successfully';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Users can only cancel or confirm orders'
      });
    }

    res.status(200).json({
      success: true,
      message,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
};

// Confirm order (for users - changes pending to confirmed)
exports.confirmOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const order = await orderService.confirmOrder(orderId, userId);

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    console.error('Confirm order error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error confirming order'
    });
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { paymentDetails } = req.body;
    const orderId = req.params.id;

    const order = await orderService.processPayment(orderId, paymentDetails);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      order
    });
  } catch (error) {
    console.error('Process payment error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error processing payment'
    });
  }
};

// Get order summary/stats for user dashboard
exports.getOrderSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const Order = require('../models/Order');

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total spent
    const totalSpentResult = await Order.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status createdAt');

    const summary = {
      totalOrders: statusCounts.reduce((sum, item) => sum + item.count, 0),
      totalSpent: totalSpentResult[0]?.totalSpent || 0,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentOrders
    };

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get order summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting order summary'
    });
  }
};

// Get orders that can be reviewed (delivered orders with products not yet reviewed)
exports.getOrdersForReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const Order = require('../models/Order');
    const Review = require('../models/Review');

    const deliveredOrders = await Order.find({
      user: userId,
      status: 'delivered'
    }).populate('items.product', 'name images slug');

    // For each order, check which products haven't been reviewed
    const ordersForReview = [];

    for (const order of deliveredOrders) {
      const itemsToReview = [];

      for (const item of order.items) {
        const existingReview = await Review.findOne({
          user: userId,
          product: item.product._id,
          order: order._id
        });

        if (!existingReview) {
          itemsToReview.push(item);
        }
      }

      if (itemsToReview.length > 0) {
        ordersForReview.push({
          ...order.toObject(),
          items: itemsToReview
        });
      }
    }

    res.status(200).json({
      success: true,
      orders: ordersForReview
    });
  } catch (error) {
    console.error('Get orders for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting orders for review'
    });
  }
};

// Track order by order number (public endpoint)
exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const Order = require('../models/Order');

    const order = await Order.findOne({ orderNumber })
      .select('orderNumber status trackingNumber statusHistory createdAt shippingAddress')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking order'
    });
  }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    // We'll use the CouponService for validation
    const CouponService = require('../services/CouponService');
    const couponService = new CouponService();

    // For validation, we simulate the usage without actually using it
    const result = await couponService.validateAndUseCoupon(code, orderAmount, req.user.id);

    // Since this is just validation, we need to reverse the usage increment
    // In a real implementation, we'd have a separate validation method
    const coupon = await couponService.getCouponByCode(code);
    await couponService.repository.updateById(coupon._id, {
      usageCount: coupon.usageCount - 1,
      $pull: { usedBy: { user: req.user.id } }
    });

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        discountAmount: result.discountAmount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);

    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      return res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error validating coupon'
    });
  }
};

// Get order statistics (Admin only)
exports.getStats = async (req, res) => {
  try {
    const { period } = req.query;
    const Order = require('../models/Order');

    let dateFilter = {};
    if (period) {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        dateFilter = { createdAt: { $gte: startDate } };
      }
    }

    // Get total orders
    const totalOrders = await Order.countDocuments(dateFilter);

    // Get total revenue (only from completed/delivered orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert status breakdown to object
    const statusBreakdownObj = statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100, // Round to 2 decimal places
        statusBreakdown: statusBreakdownObj
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting order statistics'
    });
  }
};