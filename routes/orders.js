const express = require('express');
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  confirmOrderStatus,
  processPayment,
  validateCoupon,
  getOrderSummary,
  getOrdersForReview,
  trackOrder,
  getStats
} = require('../controllers/orderController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/track/:orderNumber', trackOrder);

// Routes that support both authenticated and guest users
router.post('/', optionalAuth, createOrder);
router.get('/guest/:id', optionalAuth, getOrder);

// Protected routes
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getAllOrders);
router.get('/stats', authorize('admin'), getStats);

// User routes
router.get('/user', getUserOrders);
router.get('/summary', getOrderSummary);
router.get('/for-review', getOrdersForReview);
router.get('/:id', getOrder);
router.put('/:id/status', optionalAuth, updateOrderStatus);
router.put('/:id/confirm', optionalAuth, confirmOrderStatus);
router.post('/:id/payment', processPayment);
router.post('/validate-coupon', validateCoupon);

module.exports = router;