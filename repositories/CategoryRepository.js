const BaseRepository = require('./BaseRepository');
const Category = require('../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug) {
    return await this.model.findOne({ slug, isActive: true });
  }

  async findActiveCategories() {
    return await this.findAll({ isActive: true }, {
      sort: { sortOrder: 1, name: 1 },
      populate: ['parentCategory', 'subcategories']
    });
  }

  async findTopLevelCategories() {
    return await this.findAll(
      { parentCategory: null, isActive: true },
      {
        sort: { sortOrder: 1, name: 1 },
        populate: {
          path: 'subcategories',
          match: { isActive: true },
          populate: {
            path: 'subcategories',
            match: { isActive: true }
          }
        }
      }
    );
  }

  async findCategoryHierarchy() {
    return await this.model.aggregate([
      {
        $match: { parentCategory: null, isActive: true }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parentCategory',
          as: 'subcategories',
          pipeline: [
            { $match: { isActive: true } },
            {
              $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: 'parentCategory',
                as: 'subcategories',
                pipeline: [
                  { $match: { isActive: true } },
                  { $sort: { sortOrder: 1, name: 1 } }
                ]
              }
            },
            { $sort: { sortOrder: 1, name: 1 } }
          ]
        }
      },
      {
        $sort: { sortOrder: 1, name: 1 }
      }
    ]);
  }

  async findSubcategories(parentId) {
    return await this.findAll(
      { parentCategory: parentId, isActive: true },
      { sort: { sortOrder: 1, name: 1 } }
    );
  }

  async updateSortOrder(categoryId, sortOrder) {
    return await this.updateById(categoryId, { sortOrder: parseInt(sortOrder) });
  }

  async getCategoryProductCount(categoryId) {
    const result = await this.model.aggregate([
      { $match: { _id: categoryId } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
          pipeline: [
            { $match: { isActive: true } },
            { $count: 'total' }
          ]
        }
      },
      {
        $project: {
          productCount: { $arrayElemAt: ['$products.total', 0] }
        }
      }
    ]);

    return result[0]?.productCount || 0;
  }

  async getCategoriesWithProductCount() {
    return await this.model.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
          pipeline: [
            { $match: { isActive: true } },
            { $count: 'total' }
          ]
        }
      },
      {
        $addFields: {
          productCount: { $arrayElemAt: ['$products.total', 0] }
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          image: 1,
          parentCategory: 1,
          sortOrder: 1,
          productCount: { $ifNull: ['$productCount', 0] }
        }
      },
      {
        $sort: { sortOrder: 1, name: 1 }
      }
    ]);
  }

  async findCategoriesWithNoProducts() {
    return await this.model.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
          pipeline: [
            { $match: { isActive: true } }
          ]
        }
      },
      {
        $match: {
          'products': { $size: 0 }
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          createdAt: 1
        }
      }
    ]);
  }

  async reorderCategories(categoryOrders) {
    const bulkOps = categoryOrders.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { sortOrder: parseInt(sortOrder) }
      }
    }));

    return await this.model.bulkWrite(bulkOps);
  }

  async searchCategories(searchTerm) {
    return await this.findAll({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    });
  }
}

module.exports = CategoryRepository;