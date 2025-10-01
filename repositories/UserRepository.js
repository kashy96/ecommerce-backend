const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.model.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email) {
    return await this.model.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async createUser(userData) {
    const user = new this.model({
      ...userData,
      email: userData.email.toLowerCase()
    });
    return await user.save();
  }

  async updatePassword(userId, hashedPassword) {
    return await this.model.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
  }

  async addAddress(userId, addressData) {
    const user = await this.model.findById(userId);
    if (!user) return null;

    // If this is the first address or marked as default, make it default
    if (user.addresses.length === 0 || addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    return await user.save();
  }

  async updateAddress(userId, addressId, addressData) {
    const user = await this.model.findById(userId);
    if (!user) return null;

    const address = user.addresses.id(addressId);
    if (!address) return null;

    // If setting as default, unset other defaults
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, addressData);
    return await user.save();
  }

  async deleteAddress(userId, addressId) {
    const user = await this.model.findById(userId);
    if (!user) return null;

    user.addresses.pull(addressId);
    return await user.save();
  }

  async addToWishlist(userId, productId) {
    return await this.model.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );
  }

  async removeFromWishlist(userId, productId) {
    return await this.model.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } },
      { new: true }
    );
  }

  async getWishlist(userId) {
    const user = await this.model.findById(userId).populate('wishlist');
    return user ? user.wishlist : [];
  }

  async findByResetToken(token) {
    return await this.model.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
  }

  async setPasswordResetToken(userId, token, expires) {
    return await this.model.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: token,
        passwordResetExpires: expires
      },
      { new: true }
    );
  }

  async clearPasswordResetToken(userId) {
    return await this.model.findByIdAndUpdate(
      userId,
      {
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1
        }
      },
      { new: true }
    );
  }

  async getCustomerStats() {
    return await this.model.aggregate([
      {
        $match: { role: 'user' }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          verifiedCustomers: {
            $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] }
          }
        }
      }
    ]);
  }
}

module.exports = UserRepository;