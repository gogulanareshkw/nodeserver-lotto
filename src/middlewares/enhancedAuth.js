const jwt = require("jsonwebtoken");
const User = require('../models/user');
const constants = require('../config/constants');
const config = require('../../config');
const { 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  asyncHandler 
} = require('../utils/errorHandler');

// Enhanced Authentication Middleware
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];
  
  if (!token) {
    throw new AuthenticationError('Access token is required');
  }

  try {
    const bearer = token.split(' ');
    const validToken = bearer[1] || token;
    const decoded = jwt.verify(validToken, config.jwtSecret);
    
    const user = await User.findById(decoded._id).select('-password');
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.blockedByAdmin) {
      throw new AuthorizationError('Your account has been blocked by admin');
    }

    if (!user.activeStatus) {
      throw new AuthorizationError('Your account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    }
    throw error;
  }
});

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!roles.includes(req.user.userRole)) {
      throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Specific Role Middlewares
const requireSuperAdmin = authorize(constants.USER_ROLE_SUPER);
const requireAdmin = authorize(constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN);
const requireStaff = authorize(constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN, constants.USER_ROLE_STAFF);
const requireAgent = authorize(constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN, constants.USER_ROLE_AGENT);
const requireUser = authorize(constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN, constants.USER_ROLE_USER, constants.USER_ROLE_AGENT);

// Resource Ownership Middleware
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
    
    if (!resourceId) {
      throw new ValidationError('Resource ID is required');
    }

    const resource = await resourceModel.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource');
    }

    // Super admins and admins can access any resource
    if ([constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN].includes(req.user.userRole)) {
      req.resource = resource;
      return next();
    }

    // Check if user owns the resource
    const ownerField = resource.userId ? 'userId' : 'user';
    if (resource[ownerField]?.toString() !== req.user._id.toString()) {
      throw new AuthorizationError('You can only access your own resources');
    }

    req.resource = resource;
    next();
  });
};

// Rate Limiting Middleware (Basic Implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      requests.set(key, requests.get(key).filter(timestamp => timestamp > windowStart));
    } else {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    
    if (userRequests.length >= maxRequests) {
      throw new RateLimitError(`Too many requests. Limit: ${maxRequests} per ${windowMs / 1000 / 60} minutes`);
    }

    userRequests.push(now);
    next();
  };
};

// Server Status Check Middleware
const checkServerStatus = asyncHandler(async (req, res, next) => {
  const commonDbFuncs = require("../utils/commonDbFuncs");
  const gameSetting = commonDbFuncs.getGameSettings();

  if (gameSetting.isServerDown) {
    // Allow admin access even when server is down
    if ([constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN].includes(req.user?.userRole)) {
      return next();
    }
    
    throw new AppError('Server is currently under maintenance. Please try again later.', 503);
  }

  next();
});

// Enhanced Public Auth with Appkey Validation
const validateAppKey = (req, res, next) => {
  const { appkey } = req.query;
  
  if (!appkey) {
    throw new AuthenticationError('App key is required');
  }

  if (appkey !== config.SECURE_APP_KEY) {
    throw new AuthenticationError('Invalid app key');
  }

  next();
};

// Combined Public Auth Middleware
const publicAuth = [validateAppKey];

// Combined User Auth Middleware
const userAuth = [authenticate, requireUser];

// Combined Admin Auth Middleware
const adminAuth = [authenticate, requireAdmin];

// Combined Super Admin Auth Middleware
const superAdminAuth = [authenticate, requireSuperAdmin];

// Combined Staff Auth Middleware
const staffAuth = [authenticate, requireStaff];

// Combined Agent Auth Middleware
const agentAuth = [authenticate, requireAgent];

module.exports = {
  authenticate,
  authorize,
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  requireAgent,
  requireUser,
  requireOwnership,
  rateLimit,
  checkServerStatus,
  validateAppKey,
  publicAuth,
  userAuth,
  adminAuth,
  superAdminAuth,
  staffAuth,
  agentAuth
}; 