const BaseRepository = require('./BaseRepository');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByOrderNumber(orderNumber) {
    return await this.model.findOne({ orderNumber })
      .populate('user', 'name email')
      .populate('items.product', 'name images');
  }

  async findUserOrders(userId, options = {}) {
    const conditions = { user: userId };
    if (options.status) {
      conditions.status = options.status;
    }

    return await this.paginate(conditions, {
      ...options,
      populate: 'items.product',
      sort: { createdAt: -1 }
    });
  }

  async findOrdersByStatus(status, options = {}) {
    return await this.paginate(
      { status },
      {
        ...options,
        populate: 'user',
        sort: { createdAt: -1 }
      }
    );
  }

  async findOrdersByDateRange(startDate, endDate, options = {}) {
    const conditions = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    return await this.findAll(conditions, options);
  }

  async updateOrderStatus(orderId, status, updatedBy = null, note = null) {
    const order = await this.model.findById(orderId);
    if (!order) return null;

    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy
    });

    return await order.save();
  }

  async getOrderStats() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);
  }

  async getRevenueByPeriod(period = 'month') {
    let groupBy;

    switch (period) {
      case 'day':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupBy = {
          year: { $year: '$createdAt' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    return await this.model.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
  }

  async getTopCustomers(limit = 10) {
    return await this.model.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1,
          name: '$customer.name',
          email: '$customer.email'
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }

  async getRecentOrders(limit = 10) {
    return await this.findAll({}, {
      limit,
      sort: { createdAt: -1 },
      populate: 'user',
      select: 'orderNumber user total status createdAt'
    });
  }

  async getOrdersByPaymentMethod() {
    return await this.model.aggregate([
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
  }

  async searchOrders(searchTerm, options = {}) {
    const searchConditions = {
      $or: [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await this.paginate(searchConditions, {
      ...options,
      populate: 'user',
      sort: { createdAt: -1 }
    });
  }

  async cancelOrder(orderId) {
    return await this.updateOrderStatus(orderId, 'cancelled');
  }

  async refundOrder(orderId) {
    const order = await this.model.findById(orderId);
    if (!order) return null;

    order.status = 'refunded';
    order.payment.status = 'refunded';

    return await order.save();
  }
}

module.exports = OrderRepository;