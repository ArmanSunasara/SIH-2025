class ApiError extends Error {
  constructor(statusCode, message, errors = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends ApiError {
  constructor(message, errors) {
    super(400, message, errors);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(409, message);
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message);
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message);
  }
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message, errors);
};

const handleJWTError = () =>
  new AuthenticationError('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new AuthenticationError('Your token has expired! Please log in again.');

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError
};