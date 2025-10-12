const BaseService = require('./BaseService');
const ProductRepository = require('../repositories/ProductRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const Review = require('../models/Review');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ProductService extends BaseService {
  constructor() {
    const productRepository = new ProductRepository();
    super(productRepository);
    this.categoryRepository = new CategoryRepository();
  }

  async getProducts(filters = {}, options = {}) {
    const { page = 1, limit = 12, sort = 'newest' } = options;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { averageRating: -1 };
        break;
      case 'popular':
        sortObj = { totalReviews: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const queryOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortObj,
      populate: 'category'
    };

    if (filters.search) {
      return await this.repository.searchProducts(filters.search, queryOptions);
    }

    return await this.repository.filterProducts(filters, queryOptions);
  }

  async getProductById(productId, userId = null) {
    const product = await this.repository.findById(
      productId,
      'category'
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get related products
    const relatedProducts = await this.repository.findRelatedProducts(
      productId,
      product.category._id,
      4
    );

    return {
      product,
      relatedProducts
    };
  }

  async searchProducts(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long');
    }

    const { limit = 10 } = options;

    return await this.repository.searchProducts(
      searchTerm.trim(),
      {
        limit: parseInt(limit),
        populate: 'category',
        select: 'name price comparePrice images category brand ratings'
      }
    );
  }

  async getProductsByCategory(categoryId, options = {}) {
    // Verify category exists
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const { page = 1, limit = 12, sort = 'newest' } = options;

    let sortObj = { createdAt: -1 };
    if (sort === 'price-low') sortObj = { price: 1 };
    if (sort === 'price-high') sortObj = { price: -1 };
    if (sort === 'rating') sortObj = { averageRating: -1 };

    return await this.repository.findByCategory(categoryId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortObj,
      populate: 'category'
    });
  }

  async getFeaturedProducts(options = {}) {
    const { limit = 12 } = options;
    const products = await this.repository.findFeaturedProducts(parseInt(limit));

    return {
      products,
      pagination: {
        current: 1,
        pages: 1,
        total: products.length
      }
    };
  }

  async getAllBrands() {
    return await this.repository.getAllBrands();
  }

  async addProductReview(productId, userId, reviewData) {
    const { rating, comment, title } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Verify product exists
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      throw new ValidationError('You have already reviewed this product');
    }

    // Create new review
    const review = new Review({
      product: productId,
      user: userId,
      rating: parseInt(rating),
      title: title?.trim() || '',
      comment: comment?.trim() || '',
      isApproved: true, // Auto-approve for now
      isVerified: false // Will be updated when we verify purchase
    });

    const savedReview = await review.save();

    // Update product rating stats
    await Review.calculateAverageRating(productId);

    return await Review.findById(savedReview._id).populate('user', 'name email');
  }

  async getProductReviews(productId, options = {}) {
    const { page = 1, limit = 10 } = options;

    // Verify product exists
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get reviews from Review model
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({
      product: productId,
      isApproved: true
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      product: productId,
      isApproved: true
    });

    return {
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalReviews / parseInt(limit)),
        total: totalReviews
      }
    };
  }

  async createProduct(productData, createdBy) {
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'sku'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Verify category exists
    const category = await this.categoryRepository.findById(productData.category);
    if (!category) {
      throw new ValidationError('Invalid category');
    }

    // Check if SKU is unique
    const existingProduct = await this.repository.findOne({ sku: productData.sku });
    if (existingProduct) {
      throw new ValidationError('SKU already exists');
    }

    const product = await this.repository.create({
      ...productData,
      createdBy,
      price: parseFloat(productData.price),
      comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : undefined
    });

    return await this.repository.findById(product._id, 'category');
  }

  async updateProduct(productId, updateData) {
    // Verify product exists
    const existingProduct = await this.repository.findById(productId);
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // If updating category, verify it exists
    if (updateData.category) {
      const category = await this.categoryRepository.findById(updateData.category);
      if (!category) {
        throw new ValidationError('Invalid category');
      }
    }

    // If updating SKU, check uniqueness
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuExists = await this.repository.findOne({ sku: updateData.sku });
      if (skuExists) {
        throw new ValidationError('SKU already exists');
      }
    }

    // Parse numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.comparePrice) updateData.comparePrice = parseFloat(updateData.comparePrice);

    const updatedProduct = await this.repository.updateById(productId, updateData);
    return await this.repository.findById(updatedProduct._id, 'category');
  }

  async deleteProduct(productId) {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Instead of hard delete, deactivate the product
    return await this.repository.updateById(productId, { isActive: false });
  }

  async toggleProductStatus(productId) {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await this.repository.updateById(productId, { isActive: !product.isActive });
  }

  async updateProductInventory(productId, quantity, operation = 'subtract') {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (operation === 'subtract' && product.inventory.quantity < quantity) {
      throw new ValidationError('Insufficient stock');
    }

    return await this.repository.updateInventory(productId, quantity, operation);
  }

  async getTopSellingProducts(limit = 10) {
    return await this.repository.getTopSellingProducts(parseInt(limit));
  }

  async getLowStockProducts(threshold = 10) {
    return await this.repository.getLowStockProducts(parseInt(threshold));
  }

  async getProductsByPriceRange(minPrice, maxPrice, options = {}) {
    return await this.repository.getProductsByPriceRange(
      parseFloat(minPrice),
      parseFloat(maxPrice),
      options
    );
  }

  async getBrandsList() {
    return await this.repository.getBrandsList();
  }

  async getProductStats() {
    const stats = await this.repository.getProductStats();
    return stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      averagePrice: 0,
      totalInventory: 0,
      lowStockProducts: 0
    };
  }

  async toggleFeaturedStatus(productId) {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await this.repository.updateById(productId, { isFeatured: !product.isFeatured });
  }

  async getSimilarProducts(productId, options = {}) {
    // Verify product exists
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { limit = 8 } = options;
    const similarProducts = await this.repository.findSimilarProducts(productId, { limit: parseInt(limit) });

    return {
      products: similarProducts
    };
  }
}

module.exports = ProductService;