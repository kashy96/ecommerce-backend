const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const OrderService = require('../services/OrderService');
const orderService = new OrderService();

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber user total status createdAt');

    // Get top products by sales
    const topProducts = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly sales data
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue,
        recentOrders,
        topProducts,
        monthlySales
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard stats'
    });
  }
};

// Get all products (admin)
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting products'
    });
  }
};

// Get single product (admin)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting product'
    });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Parse JSON fields from FormData
    const jsonFields = ['tags', 'specifications', 'variants'];
    jsonFields.forEach(field => {
      if (productData[field] && typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, productData[field]);
        }
      }
    });

    // Handle nested inventory fields for create
    const inventoryData = {};
    if (productData['inventory.quantity'] !== undefined) {
      inventoryData.quantity = Number(productData['inventory.quantity']);
      delete productData['inventory.quantity'];
    }
    if (productData['inventory.lowStockThreshold'] !== undefined) {
      inventoryData.lowStockThreshold = Number(productData['inventory.lowStockThreshold']);
      delete productData['inventory.lowStockThreshold'];
    }
    if (Object.keys(inventoryData).length > 0) {
      productData.inventory = inventoryData;
    }

    // Handle nested weight fields for create
    const weightData = {};
    if (productData['weight.value'] !== undefined) {
      weightData.value = Number(productData['weight.value']);
      delete productData['weight.value'];
    }
    if (Object.keys(weightData).length > 0) {
      productData.weight = weightData;
    }

    // Handle nested dimensions fields for create
    const dimensionsData = {};
    if (productData['dimensions.length'] !== undefined) {
      dimensionsData.length = Number(productData['dimensions.length']);
      delete productData['dimensions.length'];
    }
    if (productData['dimensions.width'] !== undefined) {
      dimensionsData.width = Number(productData['dimensions.width']);
      delete productData['dimensions.width'];
    }
    if (productData['dimensions.height'] !== undefined) {
      dimensionsData.height = Number(productData['dimensions.height']);
      delete productData['dimensions.height'];
    }
    if (productData['dimensions.unit'] !== undefined) {
      dimensionsData.unit = productData['dimensions.unit'];
      delete productData['dimensions.unit'];
    }
    if (Object.keys(dimensionsData).length > 0) {
      productData.dimensions = dimensionsData;
    }

    // Handle nested SEO fields for create
    const seoData = {};
    if (productData['seo.metaTitle'] !== undefined) {
      seoData.metaTitle = productData['seo.metaTitle'];
      delete productData['seo.metaTitle'];
    }
    if (productData['seo.metaDescription'] !== undefined) {
      seoData.metaDescription = productData['seo.metaDescription'];
      delete productData['seo.metaDescription'];
    }
    if (Object.keys(seoData).length > 0) {
      productData.seo = seoData;
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: productData.name,
        isPrimary: index === 0
      }));
    }

    // Set created by
    productData.createdBy = req.user.id;

    const product = await Product.create(productData);
    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating product'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Parse JSON fields from FormData
    const jsonFields = ['tags', 'specifications', 'variants'];
    jsonFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, updateData[field]);
        }
      }
    });

    // Handle nested inventory fields
    const inventoryUpdates = {};
    if (updateData['inventory.quantity'] !== undefined) {
      inventoryUpdates.quantity = Number(updateData['inventory.quantity']);
      delete updateData['inventory.quantity'];
    }
    if (updateData['inventory.lowStockThreshold'] !== undefined) {
      inventoryUpdates.lowStockThreshold = Number(updateData['inventory.lowStockThreshold']);
      delete updateData['inventory.lowStockThreshold'];
    }
    if (Object.keys(inventoryUpdates).length > 0) {
      updateData.inventory = inventoryUpdates;
    }

    // Handle nested weight fields
    const weightUpdates = {};
    if (updateData['weight.value'] !== undefined) {
      weightUpdates.value = Number(updateData['weight.value']);
      delete updateData['weight.value'];
    }
    if (Object.keys(weightUpdates).length > 0) {
      updateData.weight = weightUpdates;
    }

    // Handle nested dimensions fields
    const dimensionsUpdates = {};
    if (updateData['dimensions.length'] !== undefined) {
      dimensionsUpdates.length = Number(updateData['dimensions.length']);
      delete updateData['dimensions.length'];
    }
    if (updateData['dimensions.width'] !== undefined) {
      dimensionsUpdates.width = Number(updateData['dimensions.width']);
      delete updateData['dimensions.width'];
    }
    if (updateData['dimensions.height'] !== undefined) {
      dimensionsUpdates.height = Number(updateData['dimensions.height']);
      delete updateData['dimensions.height'];
    }
    if (updateData['dimensions.unit'] !== undefined) {
      dimensionsUpdates.unit = updateData['dimensions.unit'];
      delete updateData['dimensions.unit'];
    }
    if (Object.keys(dimensionsUpdates).length > 0) {
      updateData.dimensions = dimensionsUpdates;
    }

    // Handle nested SEO fields
    const seoUpdates = {};
    if (updateData['seo.metaTitle'] !== undefined) {
      seoUpdates.metaTitle = updateData['seo.metaTitle'];
      delete updateData['seo.metaTitle'];
    }
    if (updateData['seo.metaDescription'] !== undefined) {
      seoUpdates.metaDescription = updateData['seo.metaDescription'];
      delete updateData['seo.metaDescription'];
    }
    if (Object.keys(seoUpdates).length > 0) {
      updateData.seo = seoUpdates;
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: updateData.name || 'Product image',
        isPrimary: index === 0
      }));

      // If keeping existing images, append new ones
      if (updateData.keepExistingImages === 'true') {
        const existingProduct = await Product.findById(productId);
        updateData.images = [...existingProduct.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating product'
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting product'
    });
  }
};

// Get all categories (admin)
exports.getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      active,
      search,
      parentId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (active === 'true') {
      filter.isActive = true;
    } else if (active === 'false') {
      filter.isActive = false;
    }

    if (parentId) {
      filter.parentId = parentId === 'null' ? null : parentId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const categories = await Category.find(filter)
      .populate('parentId', 'name')
      .populate('children', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Category.countDocuments(filter);

    res.status(200).json({
      success: true,
      categories,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting categories'
    });
  }
};

// Get single category (admin)
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentId', 'name')
      .populate('children', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting category'
    });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Handle image upload
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category'
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updateData = req.body;

    // Handle new image upload
    if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating category'
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category has products
    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting orders'
    });
  }
};

// Update order (admin)
exports.updateOrder = async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order fields
    if (status) {
      order.status = status;
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (notes) {
      order.notes = notes;
    }

    // Add to status history
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: notes,
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order'
    });
  }
};

// Admin update order status (admins can change to any status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const orderId = req.params.id;
    const adminId = req.user.id;

    // Admin can update to any valid status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
      });
    }

    const order = await orderService.updateOrderStatusAdmin(orderId, status, adminId, notes || `Status updated to ${status} by admin`);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      data: order
    });
  } catch (error) {
    console.error('Admin update order status error:', error);

    const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof BadRequestError || error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
};

// Admin confirm order (for admin - changes pending to confirmed)
exports.confirmOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const adminId = req.user.id;

    const order = await orderService.updateOrderStatusAdmin(orderId, 'confirmed', adminId, 'Order confirmed by admin');

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    console.error('Admin confirm order error:', error);

    const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof BadRequestError || error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error confirming order'
    });
  }
};
