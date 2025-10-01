const express = require('express');
const {
  createCoupon,
  getCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route
router.post('/validate', validateCoupon);

// Protected routes
router.use(protect);

// Admin only routes
router.post('/', authorize('admin'), createCoupon);
router.get('/', authorize('admin'), getCoupons);
router.get('/:id', authorize('admin'), getCoupon);
router.put('/:id', authorize('admin'), updateCoupon);
router.delete('/:id', authorize('admin'), deleteCoupon);

module.exports = router;