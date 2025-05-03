/**
 * Simplified security middleware for initial deployment
 * Provides basic security without dependencies on other services
 */

const helmet = require('helmet');

/**
 * Basic payload validation middleware
 */
const payloadValidation = (req, res, next) => {
  // Check request body size
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 10000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  // Simple check for suspicious patterns in the request body
  if (req.body && typeof req.body === 'object') {
    const requestBody = JSON.stringify(req.body).toLowerCase();
    const suspiciousPatterns = ['<script', 'javascript:', '__proto__'];
    
    for (const pattern of suspiciousPatterns) {
      if (requestBody.includes(pattern)) {
        console.warn(`Suspicious pattern detected: ${pattern}`);
        return res.status(403).json({ error: 'Request contains potentially malicious content' });
      }
    }
  }

  next();
};

/**
 * Simple wrapper function that returns a middleware function
 * This is what server.js will use directly with app.use()
 */
const simpleSecurity = (req, res, next) => {
  // Apply simple security checks
  payloadValidation(req, res, next);
};

/**
 * Apply all security middleware to an Express app
 * @param {Object} app - Express app instance
 */
const applySecurity = (app) => {
  // Set security headers with Helmet
  app.use(helmet());
  
  // Apply basic payload validation
  app.use(payloadValidation);
};

module.exports = simpleSecurity;