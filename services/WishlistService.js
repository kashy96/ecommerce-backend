const BaseService = require('./BaseService');
const WishlistRepository = require('../repositories/WishlistRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { ValidationError, NotFoundError } = require('../utils/errors');

class WishlistService extends BaseService {
  constructor() {
    const wishlistRepository = new WishlistRepository();
    super(wishlistRepository);
    this.productRepository = new ProductRepository();
  }

  async getUserWishlist(userId) {
    const wishlist = await this.repository.getUserWishlist(userId);

    if (!wishlist) {
      return {
        products: [],
        itemCount: 0
      };
    }

    // Filter out any products that may have been deleted
    const validProducts = wishlist.products.filter(item => item.product);

    return {
      products: validProducts.map(item => ({
        ...item.product.toObject(),
        addedAt: item.addedAt
      })),
      itemCount: validProducts.length
    };
  }

  async addToWishlist(userId, productId) {
    // Verify product exists and is active
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or not available');
    }

    const wishlist = await this.repository.addToWishlist(userId, productId);

    return {
      success: true,
      message: 'Product added to wishlist',
      itemCount: wishlist.products.length
    };
  }

  async removeFromWishlist(userId, productId) {
    const wishlist = await this.repository.removeFromWishlist(userId, productId);

    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    return {
      success: true,
      message: 'Product removed from wishlist',
      itemCount: wishlist.products.length
    };
  }

  async isInWishlist(userId, productId) {
    return await this.repository.isInWishlist(userId, productId);
  }

  async toggleWishlist(userId, productId) {
    const isInWishlist = await this.repository.isInWishlist(userId, productId);

    if (isInWishlist) {
      return await this.removeFromWishlist(userId, productId);
    } else {
      return await this.addToWishlist(userId, productId);
    }
  }

  async clearWishlist(userId) {
    const wishlist = await this.repository.clearWishlist(userId);

    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    return {
      success: true,
      message: 'Wishlist cleared successfully'
    };
  }

  async getWishlistCount(userId) {
    return await this.repository.getWishlistCount(userId);
  }

  async moveToCart(userId, productIds) {
    if (!productIds || !productIds.length) {
      throw new ValidationError('No products specified');
    }

    // Verify all products exist and are active
    for (const productId of productIds) {
      const product = await this.productRepository.findById(productId);
      if (!product || !product.isActive) {
        throw new NotFoundError(`Product ${productId} not found or not available`);
      }
    }

    const wishlist = await this.repository.moveToCart(userId, productIds);

    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    return {
      success: true,
      message: 'Products moved to cart',
      itemCount: wishlist.products.length
    };
  }

  async getWishlistStats(userId) {
    const wishlist = await this.repository.getUserWishlist(userId);

    if (!wishlist) {
      return {
        totalItems: 0,
        totalValue: 0,
        categories: []
      };
    }

    const validProducts = wishlist.products.filter(item => item.product);
    const totalValue = validProducts.reduce((sum, item) => sum + item.product.price, 0);

    // Group by categories
    const categoryStats = {};
    validProducts.forEach(item => {
      const categoryName = item.product.category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { name: categoryName, count: 0 };
      }
      categoryStats[categoryName].count++;
    });

    return {
      totalItems: validProducts.length,
      totalValue,
      categories: Object.values(categoryStats)
    };
  }
}

module.exports = WishlistService;