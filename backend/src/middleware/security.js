/**
 * Security middleware for the Social Engagement Platform API
 * 
 * This module provides various security middlewares to protect the API from
 * common web vulnerabilities and attacks.
 */

const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');

/**
 * Create a rate limiter middleware with specific configuration
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests per window
 * @param {string} message - Error message to display
 * @returns {Function} Rate limiting middleware
 */
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes by default
    max: max || 100, // 100 requests per window by default
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: message || 'Too many requests, please try again later.' },
    skip: (req) => {
      // Skip rate limiting for health check endpoint
      return req.path === '/health';
    },
  });
};

/**
 * Configure Content Security Policy (CSP) based on environment
 * @returns {Function} CSP middleware
 */
const configureCSP = () => {
  const cspOptions = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://pbs.twimg.com"],
      connectSrc: ["'self'", "https://api.twitter.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  };

  // Adjust CSP for different environments
  if (process.env.NODE_ENV === 'development') {
    // More relaxed CSP for development
    cspOptions.directives.scriptSrc.push("'unsafe-eval'");
    cspOptions.directives.connectSrc.push('localhost:*');
  } else if (process.env.NODE_ENV === 'production') {
    // Stricter CSP for production
    if (process.env.CORS_ORIGIN) {
      cspOptions.directives.connectSrc.push(process.env.CORS_ORIGIN);
    }
    // Add CDN domains if configured
    if (process.env.CDN_PUBLIC_URL) {
      cspOptions.directives.scriptSrc.push(process.env.CDN_PUBLIC_URL);
      cspOptions.directives.styleSrc.push(process.env.CDN_PUBLIC_URL);
      cspOptions.directives.imgSrc.push(process.env.CDN_PUBLIC_URL);
    }
  }

  return helmet.contentSecurityPolicy(cspOptions);
};

/**
 * Check for suspicious payloads and potentially block them
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const payloadValidation = (req, res, next) => {
  // Check request body size
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 10000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  // Check for suspicious patterns in the request body
  const requestBody = JSON.stringify(req.body || {}).toLowerCase();
  const suspiciousPatterns = [
    'script>',
    '<script',
    'onload=',
    'onerror=',
    'eval(',
    'document.cookie',
    'javascript:',
    '$where:',
    '$ne:',
    '$gt:',
    '__proto__',
    'constructor',
    '{{',
    '}}'
  ];

  for (const pattern of suspiciousPatterns) {
    if (requestBody.includes(pattern)) {
      // Log the suspicious request for security monitoring
      console.warn(`Suspicious pattern detected: ${pattern}`);
      console.warn(`IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
      return res.status(403).json({ error: 'Request contains potentially malicious content' });
    }
  }

  next();
};

/**
 * Specialized rate limiter for sensitive operations like login/signup
 */
const authRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour window
  5, // 5 requests per hour
  'Too many authentication attempts. Please try again later.'
);

/**
 * API rate limiter for general API endpoints
 */
const apiRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  'Rate limit exceeded. Please try again later.'
);

/**
 * Apply security middleware to Express app
 * @param {Object} app - Express app
 */
const applySecurity = (app) => {
  // Set security headers with Helmet
  app.use(helmet());
  
  // Apply Content Security Policy
  app.use(configureCSP());
  
  // Prevent MongoDB operator injection
  app.use(mongoSanitize());
  
  // Prevent XSS attacks
  app.use(xss());
  
  // Validate payloads for suspicious content
  app.use(payloadValidation);
  
  // Apply rate limiting to API routes
  app.use('/api', apiRateLimiter);
  
  // Apply stricter rate limiting to auth routes
  app.use('/api/auth', authRateLimiter);
};

module.exports = { 
  applySecurity,
  createRateLimiter,
  configureCSP,
  payloadValidation,
  authRateLimiter,
  apiRateLimiter
};