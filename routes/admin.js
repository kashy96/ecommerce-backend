const express = require('express');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategory,
  getAllOrders,
  updateOrder,
  getDashboardStats,
  updateOrderStatus,
  confirmOrderStatus
} = require('../controllers/adminController');
const { getOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Product management
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post('/products', upload.array('productImages', 10), handleMulterError, createProduct);
router.put('/products/:id', upload.array('productImages', 10), handleMulterError, updateProduct);
router.delete('/products/:id', deleteProduct);

// Category management
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);
router.post('/categories', upload.single('categoryImage'), handleMulterError, createCategory);
router.put('/categories/:id', upload.single('categoryImage'), handleMulterError, updateCategory);
router.delete('/categories/:id', deleteCategory);

// Order management
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrder);
router.put('/orders/:id', updateOrder);

router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/confirm', confirmOrderStatus);

module.exports = router;