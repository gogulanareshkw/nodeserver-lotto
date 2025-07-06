const config = require('../../config');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Error Response Handler
const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  // Log error
  config.logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    },
    request: {
      method: res.req.method,
      url: res.req.url,
      userAgent: res.req.get('User-Agent'),
      ip: res.req.ip
    }
  }, 'API Error');

  // Development error response
  if (config.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        stack: error.stack,
        isOperational: error.isOperational
      }
    });
  }

  // Production error response
  return res.status(statusCode).json({
    success: false,
    message: error.isOperational ? message : 'Something went wrong'
  });
};

// Async Error Handler Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global Error Handler Middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    err = new ValidationError('Validation failed', errors);
  }

  if (err.name === 'CastError') {
    err = new ValidationError('Invalid ID format');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ConflictError(`${field} already exists`);
  }

  if (err.name === 'JsonWebTokenError') {
    err = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    err = new AuthenticationError('Token expired');
  }

  sendErrorResponse(res, err);
};

// Request Logger Middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id
    };

    if (res.statusCode >= 400) {
      config.logger.warn(logData, 'API Request Warning');
    } else {
      config.logger.info(logData, 'API Request');
    }
  });

  next();
};

// Validation Helper
const validateRequest = (validations) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Success Response Helper
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data
  };

  // Add pagination info if present
  if (data && data.pagination) {
    response.pagination = data.pagination;
    delete response.data.pagination;
  }

  config.logger.info({
    method: res.req.method,
    url: res.req.url,
    statusCode,
    userId: res.req.user?._id
  }, 'API Success');

  return res.status(statusCode).json(response);
};

// Pagination Helper
const createPagination = (page = 1, limit = 10, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  asyncHandler,
  globalErrorHandler,
  requestLogger,
  validateRequest,
  sendSuccessResponse,
  sendErrorResponse,
  createPagination
}; 