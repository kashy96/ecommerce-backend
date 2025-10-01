const BaseRepository = require('./BaseRepository');
const Product = require('../models/Product');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findActiveProducts(conditions = {}, options = {}) {
    const searchConditions = { ...conditions, isActive: true };
    return await this.findAll(searchConditions, options);
  }

  async searchProducts(searchTerm, options = {}) {
    const searchConditions = {
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    if (options.limit && !options.page) {
      // For search suggestions, just return products array
      return await this.findAll(searchConditions, options);
    }

    const result = await this.paginate(searchConditions, options);
    return {
      products: result.results,
      pagination: result.pagination
    };
  }

  async findByCategory(categoryId, options = {}) {
    const conditions = { category: categoryId, isActive: true };
    const result = await this.paginate(conditions, options);
    return {
      products: result.results,
      pagination: result.pagination
    };
  }

  async findFeaturedProducts(limit = 6) {
    return await this.findAll(
      { isActive: true, isFeatured: true },
      { limit, sort: { createdAt: -1 }, populate: 'category' }
    );
  }

  async findRelatedProducts(productId, categoryId, limit = 4) {
    return await this.findAll(
      {
        _id: { $ne: productId },
        category: categoryId,
        isActive: true
      },
      { limit, sort: { averageRating: -1 } }
    );
  }

  async filterProducts(filters = {}, options = {}) {
    const conditions = { isActive: true };

    // Category filter
    if (filters.categories) {
      conditions.category = Array.isArray(filters.categories)
        ? { $in: filters.categories }
        : filters.categories;
    }

    // Brand filter (handle both 'brand' and 'brands')
    if (filters.brands || filters.brand) {
      const brandList = filters.brands || filters.brand;
      conditions.brand = Array.isArray(brandList)
        ? { $in: brandList }
        : brandList;
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      conditions.price = {};
      if (filters.minPrice) conditions.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice) conditions.price.$lte = Number(filters.maxPrice);
    }

    // Rating filter
    if (filters.rating) {
      conditions['averageRating'] = { $gte: Number(filters.rating) };
    }

    // In stock filter
    if (filters.inStock) {
      conditions['stock.quantity'] = { $gt: 0 };
    }

    // Search filter
    if (filters.search) {
      conditions.$text = { $search: filters.search };
    }

    const result = await this.paginate(conditions, options);
    return {
      products: result.results,
      pagination: result.pagination
    };
  }

  async addReview(productId, reviewData) {
    const product = await this.model.findById(productId);
    if (!product) return null;

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      review => review.user.toString() === reviewData.user.toString()
    );

    if (existingReview) {
      throw new Error('User has already reviewed this product');
    }

    product.reviews.push(reviewData);
    product.calculateAverageRating();

    return await product.save();
  }

  async updateReview(productId, reviewId, reviewData) {
    const product = await this.model.findById(productId);
    if (!product) return null;

    const review = product.reviews.id(reviewId);
    if (!review) return null;

    Object.assign(review, reviewData);
    product.calculateAverageRating();

    return await product.save();
  }

  async deleteReview(productId, reviewId) {
    const product = await this.model.findById(productId);
    if (!product) return null;

    product.reviews.pull(reviewId);
    product.calculateAverageRating();

    return await product.save();
  }

  async updateInventory(productId, quantity, operation = 'subtract') {
    const updateOperation = operation === 'add'
      ? { $inc: { 'inventory.quantity': quantity } }
      : { $inc: { 'inventory.quantity': -quantity } };

    return await this.model.findByIdAndUpdate(
      productId,
      updateOperation,
      { new: true }
    );
  }

  async getTopSellingProducts(limit = 10) {
    return await this.model.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $unwind: '$orders'
      },
      {
        $unwind: '$orders.items'
      },
      {
        $match: {
          'orders.items.product': { $eq: '$_id' },
          'orders.status': { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          price: { $first: '$price' },
          images: { $first: '$images' },
          totalSold: { $sum: '$orders.items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orders.items.price', '$orders.items.quantity'] } }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }

  async getLowStockProducts(threshold = 10) {
    return await this.findAll({
      'inventory.trackQuantity': true,
      'inventory.quantity': { $lte: threshold },
      isActive: true
    });
  }

  async getProductsByPriceRange(minPrice, maxPrice, options = {}) {
    return await this.findActiveProducts({
      price: { $gte: minPrice, $lte: maxPrice }
    }, options);
  }

  async getBrandsList() {
    return await this.model.distinct('brand', { isActive: true, brand: { $ne: null } });
  }

  async getAllBrands() {
    return await this.getBrandsList();
  }

  async getProductStats() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          averagePrice: { $avg: '$price' },
          totalInventory: { $sum: '$inventory.quantity' },
          lowStockProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$inventory.trackQuantity', true] },
                    { $lte: ['$inventory.quantity', 10] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
  }
}

module.exports = ProductRepository;