const { body, param, query } = require('express-validator');

const userValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],

  resetPassword: [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  addAddress: [
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    body('address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('City is required and must be less than 50 characters'),
    body('state')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('State is required and must be less than 50 characters'),
    body('zipCode')
      .trim()
      .isLength({ min: 5, max: 10 })
      .withMessage('ZIP code must be between 5 and 10 characters'),
    body('phone')
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ]
};

const productValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('category')
      .isMongoId()
      .withMessage('Please provide a valid category ID'),
    body('sku')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('SKU must be between 3 and 50 characters'),
    body('brand')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Brand must be less than 50 characters'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory quantity must be a non-negative integer'),
    body('inventory.trackQuantity')
      .optional()
      .isBoolean()
      .withMessage('Track quantity must be a boolean')
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('category')
      .optional()
      .isMongoId()
      .withMessage('Please provide a valid category ID'),
    body('sku')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('SKU must be between 3 and 50 characters'),
    body('brand')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Brand must be less than 50 characters')
  ],

  addReview: [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment must be less than 500 characters')
  ]
};

const categoryValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Slug must be between 2 and 50 characters'),
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Please provide a valid parent category ID'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Slug must be between 2 and 50 characters'),
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Please provide a valid parent category ID'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ]
};

const orderValidation = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.product')
      .isMongoId()
      .withMessage('Please provide valid product IDs'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('shippingAddress.firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping first name is required'),
    body('shippingAddress.lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping last name is required'),
    body('shippingAddress.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Shipping address must be between 5 and 200 characters'),
    body('shippingAddress.city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Shipping city is required'),
    body('shippingAddress.state')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Shipping state is required'),
    body('shippingAddress.zipCode')
      .trim()
      .isLength({ min: 5, max: 10 })
      .withMessage('Shipping ZIP code is required'),
    body('shippingAddress.phone')
      .isMobilePhone()
      .withMessage('Please provide a valid shipping phone number'),
    body('billingAddress.firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Billing first name is required'),
    body('billingAddress.lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Billing last name is required'),
    body('billingAddress.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Billing address must be between 5 and 200 characters'),
    body('billingAddress.city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Billing city is required'),
    body('billingAddress.state')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Billing state is required'),
    body('billingAddress.zipCode')
      .trim()
      .isLength({ min: 5, max: 10 })
      .withMessage('Billing ZIP code is required'),
    body('billingAddress.phone')
      .isMobilePhone()
      .withMessage('Please provide a valid billing phone number'),
    body('paymentMethod')
      .isIn(['cod', 'easypaisa'])
      .withMessage('Payment method must be either cod or easypaisa'),
    body('easypaisaDetails.accountNumber')
      .if(body('paymentMethod').equals('easypaisa'))
      .notEmpty()
      .withMessage('Easypaisa account number is required for easypaisa payment'),
    body('couponCode')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be between 3 and 20 characters')
  ],

  validateCoupon: [
    body('code')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be between 3 and 20 characters'),
    body('orderAmount')
      .isFloat({ min: 0 })
      .withMessage('Order amount must be a positive number')
  ]
};

const couponValidation = {
  create: [
    body('code')
      .trim()
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .withMessage('Coupon code must be between 3 and 20 alphanumeric characters'),
    body('discountType')
      .isIn(['percentage', 'fixed'])
      .withMessage('Coupon type must be either percentage or fixed'),
    body('discountValue')
      .isFloat({ min: 0 })
      .withMessage('Coupon value must be a positive number'),
    body('minimumOrderAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    body('maximumDiscountAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum discount must be a positive number'),
    body('validUntil')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Please provide a valid expiration date'),
    body('usageLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Usage limit must be at least 1'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters')
  ],

  update: [
    body('code')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .withMessage('Coupon code must be between 3 and 20 alphanumeric characters'),
    body('discountType')
      .optional()
      .isIn(['percentage', 'fixed'])
      .withMessage('Coupon type must be either percentage or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Coupon value must be a positive number'),
    body('minimumOrderAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    body('maximumDiscountAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum discount must be a positive number'),
    body('validUntil')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Please provide a valid expiration date'),
    body('usageLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Usage limit must be at least 1'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters')
  ]
};

const commonValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Please provide a valid ID')
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  search: [
    query('q')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Search query must be between 2 and 50 characters')
  ]
};

module.exports = {
  userValidation,
  productValidation,
  categoryValidation,
  orderValidation,
  couponValidation,
  commonValidation
};