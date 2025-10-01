const express = require('express');
const {
  getProducts,
  getProduct,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getProductBrands,
  addProductReview,
  getProductReviews
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/brands', getProductBrands);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', optionalAuth, getProduct);
router.get('/:id/reviews', getProductReviews);

// Protected routes
router.post('/:id/reviews', protect, addProductReview);

module.exports = router;