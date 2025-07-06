const config = require('../../config');

// Standard API Response Structure
class ApiResponse {
  constructor(success = true, data = null, message = '', statusCode = 200) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.requestId = this.generateRequestId();
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addPagination(pagination) {
    this.pagination = pagination;
    return this;
  }

  addMeta(meta) {
    this.meta = meta;
    return this;
  }

  addCache(cacheInfo) {
    this.cache = cacheInfo;
    return this;
  }

  toJSON() {
    const response = {
      success: this.success,
      message: this.message,
      timestamp: this.timestamp,
      requestId: this.requestId
    };

    if (this.data !== null) {
      response.data = this.data;
    }

    if (this.pagination) {
      response.pagination = this.pagination;
    }

    if (this.meta) {
      response.meta = this.meta;
    }

    if (this.cache) {
      response.cache = this.cache;
    }

    return response;
  }
}

// Success Response Builder
class SuccessResponse extends ApiResponse {
  constructor(data = null, message = 'Success', statusCode = 200) {
    super(true, data, message, statusCode);
  }

  static created(data, message = 'Resource created successfully') {
    return new SuccessResponse(data, message, 201);
  }

  static updated(data, message = 'Resource updated successfully') {
    return new SuccessResponse(data, message, 200);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new SuccessResponse(null, message, 200);
  }

  static list(data, pagination = null, message = 'Data retrieved successfully') {
    const response = new SuccessResponse(data, message, 200);
    if (pagination) {
      response.addPagination(pagination);
    }
    return response;
  }
}

// Error Response Builder
class ErrorResponse extends ApiResponse {
  constructor(message = 'Error occurred', statusCode = 500, errors = null) {
    super(false, null, message, statusCode);
    if (errors) {
      this.errors = errors;
    }
  }

  static badRequest(message = 'Bad request', errors = null) {
    return new ErrorResponse(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorResponse(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ErrorResponse(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ErrorResponse(message, 404);
  }

  static conflict(message = 'Resource conflict') {
    return new ErrorResponse(message, 409);
  }

  static validationError(errors) {
    return new ErrorResponse('Validation failed', 400, errors);
  }

  static internalError(message = 'Internal server error') {
    return new ErrorResponse(message, 500);
  }

  toJSON() {
    const response = super.toJSON();
    
    if (this.errors) {
      response.errors = this.errors;
    }

    // Add stack trace in development
    if (config.NODE_ENV === 'development' && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }
}

// Pagination Helper
class PaginationHelper {
  static create(page = 1, limit = 10, total, baseUrl = '') {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };

    // Add URLs if baseUrl provided
    if (baseUrl) {
      pagination.links = {
        first: `${baseUrl}?page=1&limit=${limit}`,
        last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        next: hasNextPage ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
        prev: hasPrevPage ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null
      };
    }

    return pagination;
  }

  static parseQuery(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

// Cache Helper
class CacheHelper {
  static createCacheInfo(cached = false, ttl = null, key = null) {
    return {
      cached,
      ttl,
      key,
      timestamp: new Date().toISOString()
    };
  }

  static generateCacheKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// Response Middleware
const responseMiddleware = (req, res, next) => {
  // Add response helpers to res object
  res.success = (data, message = 'Success', statusCode = 200) => {
    const response = new SuccessResponse(data, message, statusCode);
    return res.status(statusCode).json(response.toJSON());
  };

  res.created = (data, message = 'Resource created successfully') => {
    const response = SuccessResponse.created(data, message);
    return res.status(201).json(response.toJSON());
  };

  res.updated = (data, message = 'Resource updated successfully') => {
    const response = SuccessResponse.updated(data, message);
    return res.status(200).json(response.toJSON());
  };

  res.deleted = (message = 'Resource deleted successfully') => {
    const response = SuccessResponse.deleted(message);
    return res.status(200).json(response.toJSON());
  };

  res.list = (data, pagination = null, message = 'Data retrieved successfully') => {
    const response = SuccessResponse.list(data, pagination, message);
    return res.status(200).json(response.toJSON());
  };

  res.badRequest = (message = 'Bad request', errors = null) => {
    const response = ErrorResponse.badRequest(message, errors);
    return res.status(400).json(response.toJSON());
  };

  res.unauthorized = (message = 'Unauthorized') => {
    const response = ErrorResponse.unauthorized(message);
    return res.status(401).json(response.toJSON());
  };

  res.forbidden = (message = 'Forbidden') => {
    const response = ErrorResponse.forbidden(message);
    return res.status(403).json(response.toJSON());
  };

  res.notFound = (message = 'Resource not found') => {
    const response = ErrorResponse.notFound(message);
    return res.status(404).json(response.toJSON());
  };

  res.conflict = (message = 'Resource conflict') => {
    const response = ErrorResponse.conflict(message);
    return res.status(409).json(response.toJSON());
  };

  res.validationError = (errors) => {
    const response = ErrorResponse.validationError(errors);
    return res.status(400).json(response.toJSON());
  };

  res.internalError = (message = 'Internal server error') => {
    const response = ErrorResponse.internalError(message);
    return res.status(500).json(response.toJSON());
  };

  next();
};

// Data Transformer
class DataTransformer {
  static transformUser(user) {
    if (!user) return null;
    
    return {
      _id: user._id,
      appId: user.appId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      gender: user.gender,
      userRole: user.userRole,
      isEmailVerified: user.isEmailVerified,
      isAgentVerified: user.isAgentVerified,
      activeStatus: user.activeStatus,
      availableAmount: user.availableAmount,
      referralCount: user.referralCount,
      address: user.address,
      createdDateTime: user.createdDateTime,
      updatedDateTime: user.updatedDateTime
    };
  }

  static transformUserList(users) {
    return users.map(user => this.transformUser(user));
  }

  static transformTransaction(transaction) {
    if (!transaction) return null;
    
    return {
      _id: transaction._id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdDateTime: transaction.createdDateTime,
      updatedDateTime: transaction.updatedDateTime
    };
  }

  static transformTransactionList(transactions) {
    return transactions.map(transaction => this.transformTransaction(transaction));
  }

  static transformLotteryGame(game) {
    if (!game) return null;
    
    return {
      _id: game._id,
      gameType: game.gameType,
      gameName: game.gameName,
      startDateTime: game.startDateTime,
      endDateTime: game.endDateTime,
      status: game.status,
      settings: game.settings,
      createdDateTime: game.createdDateTime
    };
  }

  static transformLotteryGameList(games) {
    return games.map(game => this.transformLotteryGame(game));
  }
}

module.exports = {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationHelper,
  CacheHelper,
  responseMiddleware,
  DataTransformer
}; 