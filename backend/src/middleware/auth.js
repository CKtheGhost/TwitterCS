/**
 * Authentication Middleware
 * 
 * Handles JWT authentication and authorization with consent integration
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserConsent = require('../models/UserConsent');
const consentService = require('../services/consentService');

/**
 * Protect routes - only authenticated users can access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  let token;
  
  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is active
    if (user.accountStatus === 'banned') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been banned'
      });
    }
    
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended'
      });
    }
    
    if (user.accountStatus === 'deleted') {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    // Set user in request
    req.user = user;
    
    // Check for user consent record and create if necessary
    try {
      const consentRecord = await UserConsent.findOne({ user: user._id });
      
      if (!consentRecord) {
        // Initialize consent settings if not found
        await consentService.initializeConsent(user._id);
        
        // Add consent status to request
        req.consentStatus = {
          initialized: false,
          needsSetup: true
        };
      } else {
        // Add consent status to request
        req.consentStatus = {
          initialized: true,
          needsSetup: false,
          needsReview: consentRecord.needsReview || false
        };
      }
    } catch (error) {
      console.error('Error checking consent status:', error);
      // Continue even if consent check fails
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
};

/**
 * Authorize specific roles - only users with specified roles can access
 * @param  {...string} roles - Roles to authorize
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }
    
    next();
  };
};

/**
 * Require consent setup - ensures user has completed consent setup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requireConsentSetup = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
  
  try {
    // Check if consent setup is complete
    if (req.consentStatus?.needsSetup) {
      return res.status(403).json({
        success: false,
        error: 'Consent setup required',
        consentSetup: {
          required: true,
          redirectTo: '/privacy-settings'
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Consent check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error checking consent status'
    });
  }
};

/**
 * Record login - records login for audit purposes
 * Only stores data with consent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.recordLogin = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  try {
    // Check if user has consented to login history
    const hasConsent = await consentService.hasUserConsented(
      req.user.id,
      'dataUsage.loginHistory'
    );
    
    // Only record IP and user agent if user has consented
    const ip = hasConsent ? req.ip : 'consent-withheld';
    const userAgent = hasConsent ? req.headers['user-agent'] : 'consent-withheld';
    
    // Record login attempt
    await req.user.recordLoginAttempt(ip, userAgent, true);
    
    next();
  } catch (error) {
    console.error('Error recording login:', error);
    // Continue even if recording fails
    next();
  }
};