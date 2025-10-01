const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Wishlist must belong to a user'],
    unique: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'products.product': 1 });

// Virtual for products count
wishlistSchema.virtual('itemCount').get(function() {
  return this.products ? this.products.length : 0;
});

// Ensure virtual fields are serialized
wishlistSchema.set('toJSON', { virtuals: true });
wishlistSchema.set('toObject', { virtuals: true });

// Static method to add product to wishlist
wishlistSchema.statics.addToWishlist = async function(userId, productId) {
  let wishlist = await this.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new this({ user: userId, products: [] });
  }

  // Check if product already exists
  const existingProduct = wishlist.products.find(
    item => item.product.toString() === productId.toString()
  );

  if (!existingProduct) {
    wishlist.products.push({ product: productId });
    await wishlist.save();
  }

  return wishlist;
};

// Static method to remove product from wishlist
wishlistSchema.statics.removeFromWishlist = async function(userId, productId) {
  const wishlist = await this.findOne({ user: userId });

  if (!wishlist) {
    return null;
  }

  wishlist.products = wishlist.products.filter(
    item => item.product.toString() !== productId.toString()
  );

  await wishlist.save();
  return wishlist;
};

// Static method to check if product is in wishlist
wishlistSchema.statics.isInWishlist = async function(userId, productId) {
  const wishlist = await this.findOne({
    user: userId,
    'products.product': productId
  });

  return !!wishlist;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);