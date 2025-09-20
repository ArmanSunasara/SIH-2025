const authService = require('../services/authService');
const { ApiError } = require('../utils/errors');
const { asyncHandler } = require('./errorHandler');
const logger = require('../utils/logger');

const auth = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  try {
    // Validate token and get user
    const user = await authService.validateAccessToken(token);
    
    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Auth middleware error: ${error.message}`);
    throw new ApiError(401, 'Invalid token');
  }
});

// Admin role verification
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  
  next();
});

// Resource ownership verification
const requireOwnership = (Model, paramName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[paramName];
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }
    
    // Check if user owns the resource or is admin
    if (resource.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied. You can only access your own resources.');
    }
    
    req.resource = resource;
    next();
  });
};

module.exports = {
  auth,
  requireAdmin,
  requireOwnership
};