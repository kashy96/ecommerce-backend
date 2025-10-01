const BaseRepository = require('./BaseRepository');
const Coupon = require('../models/Coupon');

class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async findByCode(code) {
    return await this.model.findOne({
      code: code.toUpperCase(),
      isActive: true
    });
  }

  async findActiveCoupons() {
    return await this.findAll({
      isActive: true,
      $or: [
        { validUntil: null },
        { validUntil: { $gt: new Date() } }
      ]
    }, {
      sort: { createdAt: -1 }
    });
  }

  async findExpiringSoon(expiryDate) {
    return await this.findAll({
      isActive: true,
      validUntil: {
        $gte: new Date(),
        $lte: expiryDate
      }
    }, {
      sort: { validUntil: 1 }
    });
  }

  async checkUserUsage(couponId, userId) {
    return await this.model.findOne({
      _id: couponId,
      'usedBy.user': userId
    });
  }

  async incrementUsage(couponId, userId) {
    return await this.model.findByIdAndUpdate(
      couponId,
      {
        $inc: { usageCount: 1 },
        $push: {
          usedBy: {
            user: userId,
            usedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  async getCouponStats() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          expiredCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$validUntil', null] },
                    { $lt: ['$validUntil', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalUsage: { $sum: '$usageCount' },
          totalDiscountGiven: { $sum: '$totalDiscountGiven' }
        }
      }
    ]);
  }

  async getCouponUsageReport(couponId) {
    return await this.model.aggregate([
      { $match: { _id: couponId } },
      { $unwind: '$usedBy' },
      {
        $lookup: {
          from: 'users',
          localField: 'usedBy.user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$usedBy.user',
          usedAt: '$usedBy.usedAt',
          userName: { $arrayElemAt: ['$userInfo.name', 0] },
          userEmail: { $arrayElemAt: ['$userInfo.email', 0] }
        }
      },
      { $sort: { usedAt: -1 } }
    ]);
  }

  async getPopularCoupons(limit = 10) {
    return await this.model.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('code type value usageCount usageLimit description');
  }

  async searchCoupons(searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;

    return await this.findAll({
      isActive: true,
      $or: [
        { code: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });
  }

  async updateCouponUsage(couponId, discountAmount) {
    return await this.model.findByIdAndUpdate(
      couponId,
      {
        $inc: {
          usageCount: 1,
          totalDiscountGiven: discountAmount
        }
      },
      { new: true }
    );
  }

  async getCouponsUsedByUser(userId) {
    return await this.model.find({
      'usedBy.user': userId
    }).select('code type value usedBy.$');
  }

  async getExpiredCoupons() {
    return await this.findAll({
      isActive: true,
      validUntil: { $lt: new Date() }
    });
  }

  async deactivateExpiredCoupons() {
    return await this.model.updateMany(
      {
        isActive: true,
        validUntil: { $lt: new Date() }
      },
      { isActive: false }
    );
  }

  async getCouponsByDateRange(startDate, endDate) {
    return await this.findAll({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }, {
      sort: { createdAt: -1 }
    });
  }

  async validateCouponForUser(couponCode, userId, orderAmount) {
    const coupon = await this.model.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    // Check expiration
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return { valid: false, message: 'Coupon has expired' };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit exceeded' };
    }

    // Check if user has already used this coupon
    const userUsage = coupon.usedBy.find(usage =>
      usage.user.toString() === userId.toString()
    );
    if (userUsage) {
      return { valid: false, message: 'You have already used this coupon' };
    }

    // Check minimum amount
    if (coupon.minimumAmount && orderAmount < coupon.minimumAmount) {
      return {
        valid: false,
        message: `Minimum order amount of Rs. ${coupon.minimumAmount} required`
      };
    }

    return { valid: true, coupon };
  }
}

module.exports = CouponRepository;