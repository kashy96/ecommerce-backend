const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal server error';

  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = error.message || 'Unauthorized access';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = error.message || 'Resource not found';
  } else if (error.name === 'BadRequestError') {
    statusCode = 400;
    message = error.message || 'Bad request';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = error.message || 'Resource conflict';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = {
  handleValidationErrors,
  asyncHandler,
  errorHandler
};