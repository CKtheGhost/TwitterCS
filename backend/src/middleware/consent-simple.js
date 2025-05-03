/**
 * Simplified Consent Middleware
 * 
 * A temporary simplified version for initial setup
 */

/**
 * Add privacy headers to all responses
 */
exports.addPrivacyHeaders = (req, res, next) => {
  // Add headers related to privacy practices
  res.set('X-Privacy-Policy', process.env.PRIVACY_POLICY_URL || '/privacy');
  res.set('X-Data-Processing', 'consent-based');
  
  next();
};

/**
 * Simplified middleware for logging data access
 */
exports.logDataAccess = (dataType) => (req, res, next) => {
  console.log(`Data access logged for ${dataType}`);
  next();
};