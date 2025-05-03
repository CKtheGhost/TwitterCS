/**
 * Simplified Rate Limiter Middleware
 * 
 * Temporary simplified version for initial setup
 */
const rateLimit = require('express-rate-limit');

// Simple rate limiter for testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  }
});

module.exports = limiter;