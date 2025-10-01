class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, populate = null) {
    let query = this.model.findById(id);
    if (populate) {
      query = query.populate(populate);
    }
    return await query.exec();
  }

  async findOne(conditions, populate = null) {
    let query = this.model.findOne(conditions);
    if (populate) {
      query = query.populate(populate);
    }
    return await query.exec();
  }

  async findAll(conditions = {}, options = {}) {
    const {
      populate = null,
      sort = {},
      limit = null,
      skip = 0,
      select = null
    } = options;

    let query = this.model.find(conditions);

    if (populate) {
      query = query.populate(populate);
    }

    if (sort && Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }

    if (select) {
      query = query.select(select);
    }

    if (skip > 0) {
      query = query.skip(skip);
    }

    if (limit) {
      query = query.limit(limit);
    }

    return await query.exec();
  }

  async updateById(id, data, options = {}) {
    const defaultOptions = { new: true, runValidators: true };
    return await this.model.findByIdAndUpdate(id, data, { ...defaultOptions, ...options });
  }

  async updateOne(conditions, data, options = {}) {
    const defaultOptions = { new: true, runValidators: true };
    return await this.model.findOneAndUpdate(conditions, data, { ...defaultOptions, ...options });
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async deleteOne(conditions) {
    return await this.model.findOneAndDelete(conditions);
  }

  async deleteMany(conditions) {
    return await this.model.deleteMany(conditions);
  }

  async count(conditions = {}) {
    return await this.model.countDocuments(conditions);
  }

  async exists(conditions) {
    return await this.model.exists(conditions);
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }

  async paginate(conditions = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      populate = null,
      sort = { createdAt: -1 },
      select = null
    } = options;

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.findAll(conditions, { populate, sort, limit, skip, select }),
      this.count(conditions)
    ]);

    return {
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = BaseRepository;