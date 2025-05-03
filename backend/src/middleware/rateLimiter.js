/**
 * Rate Limiter Middleware
 * 
 * Implements rate limiting for API endpoints to prevent abuse
 */
const rateLimit = require('express-rate-limit');
const { shouldThrottleUser } = require('../services/botDetectionService');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

// Authentication rate limiter
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // limit each IP to 10 login/register attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  }
});

// Quest completion rate limiter
exports.questLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 quest completions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'You are completing quests too quickly. Please slow down.'
  }
});

// Twitter verification rate limiter
exports.verificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 verification attempts per day
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts, please try again tomorrow.'
  }
});

// Dynamic rate limiter based on user behavior
exports.dynamicRateLimiter = async (req, res, next) => {
  try {
    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }
    
    // Check if user should be throttled based on behavior
    const throttle = await shouldThrottleUser(req.user.id);
    
    if (throttle) {
      return res.status(429).json({
        success: false,
        error: 'Rate limited due to suspicious activity. Please try again later.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in dynamic rate limiter:', error);
    // Let the request proceed in case of error in the limiter
    next();
  }
};