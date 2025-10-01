const BaseService = require('./BaseService');
const CategoryRepository = require('../repositories/CategoryRepository');
const { ValidationError, NotFoundError, BadRequestError } = require('../utils/errors');

class CategoryService extends BaseService {
  constructor() {
    const categoryRepository = new CategoryRepository();
    super(categoryRepository);
  }

  async createCategory(categoryData, createdBy) {
    const { name, description, slug, parentCategory, image, sortOrder } = categoryData;

    // Validate required fields
    if (!name) {
      throw new ValidationError('Category name is required');
    }

    // Generate slug if not provided
    const categorySlug = slug || this._generateSlug(name);

    // Check if slug already exists
    const existingCategory = await this.repository.findBySlug(categorySlug);
    if (existingCategory) {
      throw new ValidationError('Category slug already exists');
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await this.repository.findById(parentCategory);
      if (!parent) {
        throw new ValidationError('Parent category not found');
      }

      // Check for circular reference
      if (await this._hasCircularReference(parentCategory, null)) {
        throw new ValidationError('Circular reference detected in category hierarchy');
      }
    }

    const category = await this.repository.create({
      name: name.trim(),
      description: description?.trim(),
      slug: categorySlug,
      parentCategory: parentCategory || null,
      image: image || '',
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      createdBy,
      isActive: true
    });

    return await this.repository.findById(category._id, 'parentCategory subcategories');
  }

  async updateCategory(categoryId, updateData) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If updating name, regenerate slug
    if (updateData.name) {
      updateData.name = updateData.name.trim();
      if (!updateData.slug) {
        updateData.slug = this._generateSlug(updateData.name);
      }
    }

    // If updating slug, check uniqueness
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await this.repository.findBySlug(updateData.slug);
      if (existingCategory) {
        throw new ValidationError('Category slug already exists');
      }
    }

    // Validate parent category change
    if (updateData.parentCategory !== undefined) {
      if (updateData.parentCategory) {
        const parent = await this.repository.findById(updateData.parentCategory);
        if (!parent) {
          throw new ValidationError('Parent category not found');
        }

        // Check for circular reference
        if (await this._hasCircularReference(updateData.parentCategory, categoryId)) {
          throw new ValidationError('Circular reference detected in category hierarchy');
        }

        // Cannot set self as parent
        if (updateData.parentCategory === categoryId) {
          throw new ValidationError('Category cannot be its own parent');
        }
      } else {
        updateData.parentCategory = null;
      }
    }

    // Parse numeric fields
    if (updateData.sortOrder !== undefined) {
      updateData.sortOrder = parseInt(updateData.sortOrder);
    }

    const updatedCategory = await this.repository.updateById(categoryId, updateData);
    return await this.repository.findById(updatedCategory._id, 'parentCategory subcategories');
  }

  async deleteCategory(categoryId) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has subcategories
    const subcategories = await this.repository.findSubcategories(categoryId);
    if (subcategories.length > 0) {
      throw new BadRequestError('Cannot delete category with subcategories');
    }

    // Check if category has products
    const productCount = await this.repository.getCategoryProductCount(categoryId);
    if (productCount > 0) {
      throw new BadRequestError('Cannot delete category with associated products');
    }

    // Soft delete by deactivating
    return await this.repository.updateById(categoryId, { isActive: false });
  }

  async getCategoryById(categoryId) {
    const category = await this.repository.findById(categoryId, 'parentCategory subcategories');
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async getCategoryBySlug(slug) {
    const category = await this.repository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async getAllCategories(options = {}) {
    const { includeInactive = false, withProductCount = false } = options;

    if (withProductCount) {
      return await this.repository.getCategoriesWithProductCount();
    }

    const filters = includeInactive ? {} : { isActive: true };
    return await this.repository.findAll(filters, {
      sort: { sortOrder: 1, name: 1 },
      populate: 'parentCategory subcategories'
    });
  }

  async getActiveCategories() {
    return await this.repository.findActiveCategories();
  }

  async getTopLevelCategories() {
    return await this.repository.findTopLevelCategories();
  }

  async getCategoryHierarchy() {
    return await this.repository.findCategoryHierarchy();
  }

  async getSubcategories(parentId) {
    // Verify parent category exists
    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw new NotFoundError('Parent category not found');
    }

    return await this.repository.findSubcategories(parentId);
  }

  async updateSortOrder(categoryId, sortOrder) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await this.repository.updateSortOrder(categoryId, sortOrder);
  }

  async reorderCategories(categoryOrders) {
    // Validate input
    if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
      throw new ValidationError('Category orders array is required');
    }

    // Verify all categories exist
    for (const { id } of categoryOrders) {
      const category = await this.repository.findById(id);
      if (!category) {
        throw new ValidationError(`Category not found: ${id}`);
      }
    }

    return await this.repository.reorderCategories(categoryOrders);
  }

  async searchCategories(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long');
    }

    return await this.repository.searchCategories(searchTerm.trim());
  }

  async toggleCategoryStatus(categoryId) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If deactivating, check for subcategories and products
    if (category.isActive) {
      const subcategories = await this.repository.findSubcategories(categoryId);
      if (subcategories.length > 0) {
        throw new BadRequestError('Cannot deactivate category with active subcategories');
      }
    }

    return await this.repository.updateById(categoryId, {
      isActive: !category.isActive
    });
  }

  async getCategoriesWithNoProducts() {
    return await this.repository.findCategoriesWithNoProducts();
  }

  async getCategoryProductCount(categoryId) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await this.repository.getCategoryProductCount(categoryId);
  }

  async getCategoryStats() {
    const [totalCategories, activeCategories, topLevelCategories, categoriesWithProducts] = await Promise.all([
      this.repository.count({}),
      this.repository.count({ isActive: true }),
      this.repository.count({ parentCategory: null, isActive: true }),
      this.repository.getCategoriesWithProductCount()
    ]);

    const categoriesWithProductsCount = categoriesWithProducts.filter(cat => cat.productCount > 0).length;

    return {
      totalCategories,
      activeCategories,
      topLevelCategories,
      categoriesWithProducts: categoriesWithProductsCount,
      categoriesWithoutProducts: activeCategories - categoriesWithProductsCount
    };
  }

  async getCategoryTree() {
    const categories = await this.repository.findActiveCategories();
    return this._buildCategoryTree(categories);
  }

  async moveCategoryToParent(categoryId, newParentId) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (newParentId) {
      const newParent = await this.repository.findById(newParentId);
      if (!newParent) {
        throw new NotFoundError('New parent category not found');
      }

      // Check for circular reference
      if (await this._hasCircularReference(newParentId, categoryId)) {
        throw new ValidationError('Circular reference detected in category hierarchy');
      }

      // Cannot set self as parent
      if (newParentId === categoryId) {
        throw new ValidationError('Category cannot be its own parent');
      }
    }

    return await this.repository.updateById(categoryId, {
      parentCategory: newParentId || null
    });
  }

  // Private helper methods
  _generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async _hasCircularReference(parentId, childId) {
    if (!parentId) return false;

    const parent = await this.repository.findById(parentId);
    if (!parent) return false;

    if (parent._id.toString() === childId) return true;

    if (parent.parentCategory) {
      return await this._hasCircularReference(parent.parentCategory, childId);
    }

    return false;
  }

  _buildCategoryTree(categories, parentId = null) {
    const tree = [];

    for (const category of categories) {
      if (category.parentCategory?.toString() === parentId?.toString()) {
        const children = this._buildCategoryTree(categories, category._id);
        tree.push({
          ...category.toObject(),
          children
        });
      }
    }

    return tree;
  }
}

module.exports = CategoryService;