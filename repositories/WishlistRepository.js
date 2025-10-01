const BaseRepository = require('./BaseRepository');
const Wishlist = require('../models/Wishlist');

class WishlistRepository extends BaseRepository {
  constructor() {
    super(Wishlist);
  }

  async getUserWishlist(userId) {
    return await this.model.findOne({ user: userId })
      .populate({
        path: 'products.product',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .sort({ 'products.addedAt': -1 });
  }

  async addToWishlist(userId, productId) {
    return await this.model.addToWishlist(userId, productId);
  }

  async removeFromWishlist(userId, productId) {
    return await this.model.removeFromWishlist(userId, productId);
  }

  async isInWishlist(userId, productId) {
    return await this.model.isInWishlist(userId, productId);
  }

  async clearWishlist(userId) {
    const wishlist = await this.model.findOne({ user: userId });
    if (!wishlist) {
      return null;
    }

    wishlist.products = [];
    await wishlist.save();
    return wishlist;
  }

  async getWishlistCount(userId) {
    const wishlist = await this.model.findOne({ user: userId });
    return wishlist ? wishlist.products.length : 0;
  }

  async moveToCart(userId, productIds) {
    const wishlist = await this.model.findOne({ user: userId });
    if (!wishlist) {
      return null;
    }

    // Remove specified products from wishlist
    wishlist.products = wishlist.products.filter(
      item => !productIds.includes(item.product.toString())
    );

    await wishlist.save();
    return wishlist;
  }
}

module.exports = WishlistRepository;