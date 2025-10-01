const BaseService = require('./BaseService');
const CouponRepository = require('../repositories/CouponRepository');
const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

class CouponService extends BaseService {
  constructor() {
    const couponRepository = new CouponRepository();
    super(couponRepository);
  }

  async createCoupon(couponData, createdBy) {
    const {
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      validUntil,
      usageLimit,
      description
    } = couponData;

    // Validate required fields
    if (!code || !discountType || !discountValue) {
      throw new ValidationError('Code, discountType and discountValue are required');
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      throw new ValidationError('Coupon type must be percentage or fixed');
    }

    if (discountValue <= 0) {
      throw new ValidationError('Coupon value must be greater than 0');
    }

    if (discountType === 'percentage' && discountValue > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100%');
    }

    // Check if coupon code already exists
    const existingCoupon = await this.repository.findByCode(code.toUpperCase());
    if (existingCoupon) {
      throw new ValidationError('Coupon code already exists');
    }

    // Validate dates
    if (validUntil && new Date(validUntil) <= new Date()) {
      throw new ValidationError('Expiration date must be in the future');
    }

    const coupon = await this.repository.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: parseFloat(discountValue),
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : 0,
      maximumDiscountAmount: maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : null,
      validFrom: new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      description: description?.trim(),
      createdBy,
      isActive: true,
      usageCount: 0
    });

    return coupon;
  }

  async updateCoupon(couponId, updateData) {
    const coupon = await this.repository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // If updating code, check uniqueness
    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await this.repository.findByCode(updateData.code.toUpperCase());
      if (existingCoupon) {
        throw new ValidationError('Coupon code already exists');
      }
      updateData.code = updateData.code.toUpperCase().trim();
    }

    // Validate type and value
    if (updateData.type && !['percentage', 'fixed'].includes(updateData.type)) {
      throw new ValidationError('Coupon type must be percentage or fixed');
    }

    if (updateData.value !== undefined) {
      if (updateData.value <= 0) {
        throw new ValidationError('Coupon value must be greater than 0');
      }
      if ((updateData.type || coupon.type) === 'percentage' && updateData.value > 100) {
        throw new ValidationError('Percentage discount cannot exceed 100%');
      }
      updateData.value = parseFloat(updateData.value);
    }

    // Parse numeric fields
    if (updateData.minimumAmount !== undefined) {
      updateData.minimumAmount = parseFloat(updateData.minimumAmount);
    }
    if (updateData.maximumDiscount !== undefined) {
      updateData.maximumDiscount = updateData.maximumDiscount ? parseFloat(updateData.maximumDiscount) : null;
    }
    if (updateData.usageLimit !== undefined) {
      updateData.usageLimit = updateData.usageLimit ? parseInt(updateData.usageLimit) : null;
    }

    // Validate expiration date
    if (updateData.expiresAt) {
      if (new Date(updateData.expiresAt) <= new Date()) {
        throw new ValidationError('Expiration date must be in the future');
      }
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    return await this.repository.updateById(couponId, updateData);
  }

  async deleteCoupon(couponId) {
    const coupon = await this.repository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Soft delete by deactivating
    return await this.repository.updateById(couponId, { isActive: false });
  }

  async validateAndUseCoupon(couponCode, orderAmount, userId) {
    const coupon = await this.repository.findByCode(couponCode.toUpperCase());

    if (!coupon) {
      throw new NotFoundError('Invalid coupon code');
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      throw new BadRequestError('Coupon is no longer valid');
    }

    // Check expiration
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestError('Coupon has expired');
    }

    // Check minimum amount
    if (coupon.minimumAmount && orderAmount < coupon.minimumAmount) {
      throw new BadRequestError(`Minimum order amount of Rs. ${coupon.minimumAmount} required for this coupon`);
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit exceeded');
    }

    // Check if user has already used this coupon
    const userUsage = await this.repository.checkUserUsage(coupon._id, userId);
    if (userUsage) {
      throw new BadRequestError('You have already used this coupon');
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    // Mark coupon as used
    await this.repository.incrementUsage(coupon._id, userId);

    return {
      coupon,
      discountAmount
    };
  }

  async getCouponByCode(couponCode) {
    const coupon = await this.repository.findByCode(couponCode.toUpperCase());
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }
    return coupon;
  }

  async getAllCoupons(options = {}) {
    const { page = 1, limit = 10, status = 'all' } = options;

    let filters = {};
    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    } else if (status === 'expired') {
      filters.expiresAt = { $lt: new Date() };
    }

    return await this.repository.findAll(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });
  }

  async getActiveCoupons() {
    return await this.repository.findActiveCoupons();
  }

  async toggleCouponStatus(couponId) {
    const coupon = await this.repository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    return await this.repository.updateById(couponId, {
      isActive: !coupon.isActive
    });
  }

  async getCouponStats() {
    const stats = await this.repository.getCouponStats();
    return stats[0] || {
      totalCoupons: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      totalUsage: 0,
      totalDiscountGiven: 0
    };
  }

  async getCouponUsageReport(couponId) {
    const coupon = await this.repository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    const usageReport = await this.repository.getCouponUsageReport(couponId);
    return {
      coupon,
      usage: usageReport
    };
  }

  async getPopularCoupons(limit = 10) {
    return await this.repository.getPopularCoupons(parseInt(limit));
  }

  async searchCoupons(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long');
    }

    return await this.repository.searchCoupons(searchTerm.trim(), options);
  }

  async getExpiringSoon(days = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await this.repository.findExpiringSoon(expiryDate);
  }
}

module.exports = CouponService;