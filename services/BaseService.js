const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async create(data) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError('Resource already exists');
      }
      if (error.name === 'ValidationError') {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async findById(id, populate = null) {
    const resource = await this.repository.findById(id, populate);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    return resource;
  }

  async findOne(conditions, populate = null) {
    return await this.repository.findOne(conditions, populate);
  }

  async findAll(conditions = {}, options = {}) {
    return await this.repository.findAll(conditions, options);
  }

  async update(id, data) {
    const updated = await this.repository.updateById(id, data);
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }
    return updated;
  }

  async delete(id) {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Resource not found');
    }
    return deleted;
  }

  async paginate(conditions = {}, options = {}) {
    return await this.repository.paginate(conditions, options);
  }

  async count(conditions = {}) {
    return await this.repository.count(conditions);
  }

  async exists(conditions) {
    return await this.repository.exists(conditions);
  }
}

module.exports = BaseService;