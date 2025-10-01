const WishlistService = require('../services/WishlistService');
const { ValidationError, NotFoundError } = require('../utils/errors');

const wishlistService = new WishlistService();

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await wishlistService.getUserWishlist(userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting wishlist'
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await wishlistService.addToWishlist(userId, productId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding to wishlist'
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await wishlistService.removeFromWishlist(userId, productId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error removing from wishlist'
    });
  }
};

// Toggle product in wishlist
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await wishlistService.toggleWishlist(userId, productId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Toggle wishlist error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error toggling wishlist'
    });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await wishlistService.clearWishlist(userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error clearing wishlist'
    });
  }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const isInWishlist = await wishlistService.isInWishlist(userId, productId);

    res.status(200).json({
      success: true,
      data: { isInWishlist }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking wishlist'
    });
  }
};

// Get wishlist count
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await wishlistService.getWishlistCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting wishlist count'
    });
  }
};

// Move products to cart
exports.moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body;

    const result = await wishlistService.moveToCart(userId, productIds);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Move to cart error:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error moving to cart'
    });
  }
};

// Get wishlist statistics
exports.getWishlistStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await wishlistService.getWishlistStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get wishlist stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting wishlist stats'
    });
  }
};