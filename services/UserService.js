const BaseService = require('./BaseService');
const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const QueueService = require('./QueueService');

class UserService extends BaseService {
  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
    this.queueService = new QueueService();
  }

  async registerUser(userData) {
    const { name, email, password, phone } = userData;

    // Validate input
    if (!name || !email || !password) {
      throw new ValidationError('Name, email and password are required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.repository.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim(),
      role: 'user'
    });

    // Generate JWT token
    const token = this._generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Queue welcome email for background processing
    try {
      await this.queueService.queueWelcomeEmail(userResponse);
      console.log(`Welcome email queued for user ${userResponse.email}`);
    } catch (error) {
      console.error('Failed to queue welcome email:', error);
      // Don't fail registration if email queueing fails
    }

    return { user: userResponse, token };
  }

  async loginUser(email, password) {
    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user with password
    const user = await this.repository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = this._generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  async getUserProfile(userId) {
    return await this.repository.findById(userId, 'wishlist');
  }

  async updateUserProfile(userId, updateData) {
    const { name, phone } = updateData;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();

    return await this.repository.updateById(userId, updateFields);
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Validate input
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    // Get user with password
    const user = await this.repository.findOne({ _id: userId }, null);
    const userWithPassword = await this.repository.findByEmailWithPassword(user.email);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    return await this.repository.updatePassword(userId, hashedNewPassword);
  }

  async forgotPassword(email) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('No user found with that email address');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save reset token
    await this.repository.setPasswordResetToken(user._id, hashedToken, tokenExpires);

    // Queue password reset email for background processing
    try {
      await this.queueService.queuePasswordResetEmail(user.email, resetToken);
      console.log(`Password reset email queued for user ${user.email}`);
    } catch (error) {
      // Clear reset token if email queueing fails
      await this.repository.clearPasswordResetToken(user._id);
      throw new Error('Email could not be queued for sending');
    }

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token, newPassword) {
    // Validate input
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by token
    const user = await this.repository.findByResetToken(hashedToken);
    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await this.repository.updatePassword(user._id, hashedPassword);
    await this.repository.clearPasswordResetToken(user._id);

    // Generate new JWT token
    const jwtToken = this._generateToken(user._id);

    return { message: 'Password reset successful', token: jwtToken };
  }

  async addUserAddress(userId, addressData) {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    return await this.repository.addAddress(userId, addressData);
  }

  async updateUserAddress(userId, addressId, addressData) {
    return await this.repository.updateAddress(userId, addressId, addressData);
  }

  async deleteUserAddress(userId, addressId) {
    return await this.repository.deleteAddress(userId, addressId);
  }

  async addToWishlist(userId, productId) {
    return await this.repository.addToWishlist(userId, productId);
  }

  async removeFromWishlist(userId, productId) {
    return await this.repository.removeFromWishlist(userId, productId);
  }

  async getUserWishlist(userId) {
    return await this.repository.getWishlist(userId);
  }

  async getUserStats() {
    const stats = await this.repository.getCustomerStats();
    return stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      verifiedCustomers: 0
    };
  }

  async deactivateUser(userId) {
    return await this.repository.updateById(userId, { isActive: false });
  }

  async activateUser(userId) {
    return await this.repository.updateById(userId, { isActive: true });
  }

  _generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });
  }

  _verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

module.exports = UserService;