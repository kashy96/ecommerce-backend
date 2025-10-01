const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      rating
    } = req.query;

    const filter = {
      product: productId,
      isApproved: true
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const reviews = await Review.find(filter)
      .populate('user', 'name')
      .populate('order', 'orderNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting reviews'
    });
  }
};

// Get review statistics for a product
exports.getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      {
        $match: {
          product: productId,
          isApproved: true
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Create rating distribution
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    stats.forEach(stat => {
      ratingDistribution[stat._id] = stat.count;
    });

    const totalReviews = stats.reduce((sum, stat) => sum + stat.count, 0);
    const averageRating = stats.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / totalReviews || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting review statistics'
    });
  }
};

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { orderId, rating, title, comment } = req.body;
    const userId = req.user.id;

    // Verify that the user bought this product
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: { $in: ['delivered'] },
      'items.product': productId
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products you have purchased and received'
      });
    }

    // Check if user already reviewed this product for this order
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    const reviewData = {
      product: productId,
      user: userId,
      order: orderId,
      rating,
      title,
      comment,
      isVerified: true // Since we verified the purchase
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      reviewData.images = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: 'Review image'
      }));
    }

    const review = await Review.create(reviewData);
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating review'
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to update it'
      });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: 'Review image'
      }));
      review.images = [...review.images, ...newImages];
    }

    await review.save();
    await review.populate('user', 'name');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating review'
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to delete it'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting review'
    });
  }
};

// Vote on review helpfulness
exports.voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    if (!review.canUserVote(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this review'
      });
    }

    // Add vote
    review.votedBy.push({
      user: userId,
      helpful
    });

    // Update helpful votes count
    if (helpful) {
      review.helpfulVotes += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      helpfulVotes: review.helpfulVotes
    });
  } catch (error) {
    console.error('Vote review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording vote'
    });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images slug')
      .populate('order', 'orderNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user reviews'
    });
  }
};

// Admin: Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isApproved,
      rating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (isApproved === 'true') {
      filter.isApproved = true;
    } else if (isApproved === 'false') {
      filter.isApproved = false;
    }

    if (rating) {
      filter.rating = Number(rating);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name')
      .populate('order', 'orderNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting reviews'
    });
  }
};

// Admin: Update review approval status
exports.updateReviewApproval = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved, adminResponse } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isApproved = isApproved;

    if (adminResponse) {
      review.adminResponse = {
        message: adminResponse,
        respondedAt: new Date(),
        respondedBy: req.user.id
      };
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review approval status updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating review approval'
    });
  }
};