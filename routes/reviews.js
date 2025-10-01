const express = require('express');
const {
  getProductReviews,
  getReviewStats,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  getUserReviews,
  getAllReviews,
  updateReviewApproval
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/stats', getReviewStats);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.get('/my-reviews', getUserReviews);
router.post('/product/:productId', upload.array('reviewImages', 5), handleMulterError, createReview);
router.put('/:reviewId', upload.array('reviewImages', 5), handleMulterError, updateReview);
router.delete('/:reviewId', deleteReview);
router.post('/:reviewId/vote', voteReview);

// Admin routes
router.get('/', authorize('admin'), getAllReviews);
router.put('/:reviewId/approval', authorize('admin'), updateReviewApproval);

module.exports = router;