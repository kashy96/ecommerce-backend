const ProductService = require('../services/ProductService');
const { ValidationError, NotFoundError } = require('../utils/errors');

const productService = new ProductService();

// Get all products with filtering and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      categories,
      brand,
      brands,
      minPrice,
      maxPrice,
      rating,
      sort,
      sortBy,
      page = 1,
      limit = 12,
      search,
      inStock
    } = req.query;

    const filters = {
      search,
      inStock: inStock === 'true'
    };

    // Handle categories (both singular and plural)
    if (categories) {
      filters.categories = categories.split(',').map(c => c.trim());
    } else if (category) {
      filters.categories = [category];
    }

    // Handle brands (both singular and plural)
    if (brands) {
      filters.brands = brands.split(',').map(b => b.trim());
    } else if (brand) {
      filters.brands = [brand];
    }

    // Handle price range
    if (minPrice) filters.minPrice = minPrice;
    if (maxPrice) filters.maxPrice = maxPrice;

    // Handle rating
    if (rating) filters.rating = rating;

    const options = { page, limit, sort: sortBy || sort };
    const result = await productService.getProducts(filters, options);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get products error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting products'
    });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const result = await productService.getProductById(req.params.id, req.user?.id);

    res.status(200).json({
      success: true,
      data: result.product
    });
  } catch (error) {
    console.error('Get product error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting product'
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const products = await productService.searchProducts(q, { limit });

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Search products error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error searching products'
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const result = await productService.getFeaturedProducts({ limit });

    res.status(200).json({
      success: true,
      data: result.products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting featured products'
    });
  }
};

// Get all product brands
exports.getProductBrands = async (req, res) => {
  try {
    const brands = await productService.getAllBrands();

    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Get product brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting product brands'
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sort } = req.query;

    const result = await productService.getProductsByCategory(categoryId, { page, limit, sort });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get products by category error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting products by category'
    });
  }
};

// Add product review
exports.addProductReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const reviewData = req.body;

    const product = await productService.addProductReview(productId, userId, reviewData);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      product
    });
  } catch (error) {
    console.error('Add review error:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding review'
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const productId = req.params.id;

    const result = await productService.getProductReviews(productId, { page, limit });

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get reviews error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting reviews'
    });
  }
};

// Get similar products
exports.getSimilarProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const { limit = 8 } = req.query;

    const result = await productService.getSimilarProducts(productId, { limit });

    res.status(200).json({
      success: true,
      data: result.products
    });
  } catch (error) {
    console.error('Get similar products error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting similar products'
    });
  }
};