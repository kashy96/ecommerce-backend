const Category = require('../models/Category');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active === 'true') {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .populate('parentId', 'name slug')
      .populate('children', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting categories'
    });
  }
};

// Get single category by ID
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentId', 'name slug')
      .populate('children', 'name slug')
      .populate('productsCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting category'
    });
  }
};

// Get single category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('parentId', 'name slug')
      .populate('children', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting category'
    });
  }
};

// Get category hierarchy
exports.getCategoryHierarchy = async (req, res) => {
  try {
    // Get all top-level categories (no parent)
    const topCategories = await Category.find({
      parentId: null,
      isActive: true
    })
    .populate({
      path: 'children',
      match: { isActive: true },
      populate: {
        path: 'children',
        match: { isActive: true },
        populate: {
          path: 'children',
          match: { isActive: true }
        }
      }
    })
    .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: topCategories
    });
  } catch (error) {
    console.error('Get category hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting category hierarchy'
    });
  }
};

// Get categories with pagination for admin management
exports.getCategoriesPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const active = req.query.active;

    // Build filter
    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get categories with pagination (flat list for admin management)
    const categories = await Category.find(filter)
      .populate('parentId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Category.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        page,
        pages: totalPages,
        total,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Get categories paginated error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting categories'
    });
  }
};