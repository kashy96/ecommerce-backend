const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  checkWishlist,
  getWishlistCount,
  moveToCart,
  getWishlistStats
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// Get user's wishlist
router.get('/', getWishlist);

// Get wishlist count
router.get('/count', getWishlistCount);

// Get wishlist statistics
router.get('/stats', getWishlistStats);

// Check if product is in wishlist
router.get('/check/:productId', checkWishlist);

// Add product to wishlist
router.post('/add/:productId', addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', removeFromWishlist);

// Toggle product in wishlist
router.post('/toggle/:productId', toggleWishlist);

// Clear entire wishlist
router.delete('/clear', clearWishlist);

// Move products to cart
router.post('/move-to-cart', moveToCart);

module.exports = router;