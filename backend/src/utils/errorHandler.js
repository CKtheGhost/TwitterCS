/**
 * Error Handling Utilities
 * 
 * Provides standardized error handling and formatting across the application.
 */

// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Used to distinguish operational errors from programmer errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Function for handling async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let errors = err.errors || [];
  
  // Log error
  console.error(`[ERROR] ${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    error: err.stack
  });
  
  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate key error';
    
    // Extract field name from error message
    const field = Object.keys(err.keyValue)[0];
    errors = [{
      field,
      message: `${field} already exists`
    }];
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
    errors = [{
      field: err.path,
      message: `Invalid ${err.path}: ${err.value}`
    }];
  }
  
  // Consent errors - handle specifically for better user experience
  if (err.message.includes('consent') || err.message.includes('Consent')) {
    statusCode = 403;
    
    // Check if this is a specific consent type
    const consentMatch = err.message.match(/consent for ([a-zA-Z.]+)/i);
    if (consentMatch && consentMatch[1]) {
      errors = [{
        type: 'consent',
        consentType: consentMatch[1],
        message: `User has not consented to ${consentMatch[1]}`
      }];
    }
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors.length > 0 && { details: errors })
    },
    // In development mode, include the stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Create and throw standardized API error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Array of detailed error objects
 */
const throwError = (message, statusCode = 400, errors = []) => {
  throw new APIError(message, statusCode, errors);
};

/**
 * Not found error handler middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = new APIError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  APIError,
  asyncHandler,
  errorMiddleware,
  throwError,
  notFoundHandler
};