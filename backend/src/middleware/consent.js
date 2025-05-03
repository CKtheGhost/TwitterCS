/**
 * Consent Middleware
 * 
 * Middleware for checking and enforcing user consent requirements.
 * Ensures data is only accessed when users have explicitly consented.
 */
const consentService = require('../services/consentService');

/**
 * Middleware to check if user has provided consent for a specific category
 * If not, request is rejected with appropriate error message
 * 
 * @param {string} consentCategory - The consent category to check (e.g., 'socialVerification.twitter')
 * @returns {Function} Express middleware
 */
exports.checkConsent = (consentCategory) => async (req, res, next) => {
  try {
    // Skip consent check for admin routes if configured to do so
    if (req.user.role === 'admin' && process.env.ADMIN_BYPASS_CONSENT === 'true') {
      // Log this bypass for audit purposes
      console.log(`Admin ${req.user.id} bypassed consent check for ${consentCategory}`);
      return next();
    }
    
    const hasConsent = await consentService.hasUserConsented(req.user.id, consentCategory);
    
    if (!hasConsent) {
      return res.status(403).json({
        success: false,
        error: `Consent required for ${consentCategory.split('.').join(' ')}`,
        needsConsent: true,
        consentType: consentCategory,
        consentInstructions: 'Please provide explicit consent before proceeding'
      });
    }
    
    // Add consent info to request for controllers to use
    req.consentInfo = {
      category: consentCategory,
      consented: true,
      checkedAt: new Date()
    };
    
    next();
  } catch (error) {
    console.error(`Error checking consent for ${consentCategory}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Unable to verify consent status'
    });
  }
};

/**
 * Middleware to log data access for auditing and transparency
 * 
 * @param {string} dataType - The type of data being accessed
 * @returns {Function} Express middleware
 */
exports.logDataAccess = (dataType) => async (req, res, next) => {
  try {
    // Create audit record of this data access
    const requestInfo = {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      dataType,
      timestamp: new Date()
    };
    
    // Log access (could be stored in database for audit)
    console.log('Data access logged:', requestInfo);
    
    // Attach to request for use in controllers
    req.dataAccessLog = requestInfo;
    
    next();
  } catch (error) {
    console.error('Error logging data access:', error);
    // Continue processing even if logging fails
    next();
  }
};

/**
 * Middleware to add privacy notice to all responses
 */
exports.addPrivacyHeaders = (req, res, next) => {
  // Add headers related to privacy practices
  res.set('X-Privacy-Policy', process.env.PRIVACY_POLICY_URL || '/privacy');
  res.set('X-Data-Processing', 'consent-based');
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send to add privacy information to JSON responses
  res.send = function(body) {
    // Only modify JSON responses
    if (res.get('Content-Type')?.includes('application/json')) {
      try {
        const data = JSON.parse(body);
        
        // Add privacy information if not already present
        if (!data.privacyInfo) {
          data.privacyInfo = {
            note: 'Your privacy is important to us. Visit our privacy policy to learn more.',
            policyUrl: process.env.PRIVACY_POLICY_URL || '/privacy',
            consentManagement: '/dashboard/privacy'
          };
        }
        
        // Use the modified body
        body = JSON.stringify(data);
      } catch (error) {
        // If parsing fails, just continue with the original body
        console.error('Error adding privacy headers:', error);
      }
    }
    
    // Call the original send with potentially modified body
    return originalSend.call(this, body);
  };
  
  next();
};