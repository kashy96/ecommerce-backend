const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide product description']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'Please provide SKU']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Please provide inventory quantity'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low stock threshold cannot be negative'],
      default: 5
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorders: {
      type: Boolean,
      default: false
    }
  },
  variants: [{
    name: { type: String, required: true }, // e.g., "Size", "Color"
    options: [{
      value: String, // e.g., "Large", "Red"
      price: { type: Number, default: 0 } // additional price
    }]
  }],
  specifications: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  tags: [String],
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual field for ratings object to match frontend expectations
productSchema.virtual('ratings').get(function() {
  return {
    average: this.averageRating || 0,
    count: this.totalReviews || 0
  };
});

// Virtual field for quantity at root level to match frontend expectations
productSchema.virtual('quantity').get(function() {
  return this.inventory?.quantity || 0;
});

// Virtual field for lowStockThreshold at root level to match frontend expectations
productSchema.virtual('lowStockThreshold').get(function() {
  return this.inventory?.lowStockThreshold || 5;
});

// Virtual field for weight at root level to match frontend expectations (avoid conflict with schema field)
productSchema.virtual('weightValue').get(function() {
  return this.weight?.value || null;
});

// Virtual fields for SEO at root level to match frontend expectations
productSchema.virtual('seoTitle').get(function() {
  return this.seo?.metaTitle || '';
});

productSchema.virtual('seoDescription').get(function() {
  return this.seo?.metaDescription || '';
});

// Virtual field for weightUnit at root level to match frontend expectations
productSchema.virtual('weightUnit').get(function() {
  return this.weight?.unit || 'kg';
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Product', productSchema);