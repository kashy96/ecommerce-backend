const express = require('express');
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getCategoryHierarchy,
  getCategoriesPaginated
} = require('../controllers/categoryController');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/paginated', getCategoriesPaginated); // For admin management
router.get('/hierarchy', getCategoryHierarchy);
router.get('/tree', getCategoryHierarchy); // Alias for hierarchy
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

module.exports = router;