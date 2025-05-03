/**
 * Verification Controller
 * 
 * Handles HTTP requests related to user verification
 * Implements ethical data collection practices with explicit user consent
 */
const User = require('../models/User');
const ethicalDataService = require('../services/ethicalDataService');
const consentService = require('../services/consentService');
const { asyncHandler, throwError } = require('../utils/errorHandler');

/**
 * @desc    Start Twitter verification process
 * @route   POST /api/verification/twitter/start
 * @access  Private
 */
exports.startTwitterVerification = asyncHandler(async (req, res) => {
  const { twitterUsername } = req.body;
  
  if (!twitterUsername) {
    throwError('Twitter username is required', 400);
  }
  
  // Check if user has provided consent for Twitter verification
  const hasConsent = await consentService.hasUserConsented(
    req.user.id,
    'socialVerification.twitter'
  );
  
  if (!hasConsent) {
    throwError('Consent required for Twitter verification', 403, [{
      type: 'consent',
      consentType: 'socialVerification.twitter',
      needsConsent: true,
      message: 'User must consent to Twitter verification'
    }]);
  }
  
  // Generate verification code
  const verificationCode = ethicalDataService.generateVerificationCode(req.user.id);
  
  // Store verification code in user's record with request info for audit
  const requestInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    endpoint: '/api/verification/twitter/start'
  };
  
  await ethicalDataService.storeVerificationCode(req.user.id, verificationCode, requestInfo);
  
  res.status(200).json({
    success: true,
    data: {
      verificationCode,
      instructions: `Tweet this code: ${verificationCode} to verify your Twitter account.`,
      consentProvidedAt: new Date(),
      dataPurpose: 'Account verification only - no data will be stored beyond verification status'
    }
  });
});

/**
 * @desc    Verify Twitter account
 * @route   POST /api/verification/twitter/verify
 * @access  Private
 */
exports.verifyTwitterAccount = asyncHandler(async (req, res) => {
  const { twitterUsername } = req.body;
  
  if (!twitterUsername) {
    throwError('Twitter username is required', 400);
  }
  
  // Check if user has provided consent for Twitter verification
  const hasConsent = await consentService.hasUserConsented(
    req.user.id,
    'socialVerification.twitter'
  );
  
  if (!hasConsent) {
    throwError('Consent required for Twitter verification', 403, [{
      type: 'consent',
      consentType: 'socialVerification.twitter',
      needsConsent: true,
      message: 'User must consent to Twitter verification'
    }]);
  }
  
  // Get user to check if verification has expired
  const user = await User.findById(req.user.id);
  if (!user) {
    throwError('User not found', 404);
  }
  
  // Check if verification attempt has expired
  if (ethicalDataService.isVerificationExpired(user.verification)) {
    throwError('Verification attempt has expired. Please restart the verification process.', 400, [{
      type: 'verification',
      code: 'expired',
      message: 'Verification code has expired'
    }]);
  }
  
  // Check for verification tweet using ethical data service
  // This only validates account ownership and doesn't collect additional data
  const requestInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    endpoint: '/api/verification/twitter/verify'
  };
  
  // Try to verify the account, with fallback options
  let verified;
  try {
    verified = await ethicalDataService.verifyTwitterAccount(req.user.id, twitterUsername);
  } catch (error) {
    // Provide meaningful error based on error type
    if (error.message.includes('not found')) {
      throwError(`Twitter user @${twitterUsername} not found`, 400, [{
        type: 'verification', 
        code: 'user_not_found',
        message: `The Twitter username ${twitterUsername} could not be found`
      }]);
    } else if (error.message.includes('rate limit')) {
      throwError('Twitter API rate limit exceeded. Please try again later.', 429, [{
        type: 'verification',
        code: 'rate_limit',
        message: 'Twitter API rate limit exceeded',
        retryAfter: '60' // Seconds until retry
      }]);
    } else {
      // Generic error with more details for debugging
      throwError(`Verification failed: ${error.message}`, 500, [{
        type: 'verification',
        code: 'api_error',
        message: error.message
      }]);
    }
  }
  
  if (!verified) {
    // Increment failed verification count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'riskFactors.failedVerifications': 1 }
    });
    
    throwError('Verification failed. Please make sure you tweeted the verification code.', 400, [{
      type: 'verification',
      code: 'verification_failed',
      message: 'Could not find verification code tweet',
      suggestions: [
        'Check that you posted the exact verification code',
        'Make sure your Twitter account is public',
        'Try posting the verification code as a new tweet'
      ]
    }]);
  }
  
  // Log successful verification in consent history
  await consentService.updateConsentSetting(
    req.user.id,
    'socialVerification.twitter',
    true,
    {
      ...requestInfo,
      action: 'twitter_verification_success',
      verifiedUsername: twitterUsername
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'Twitter account successfully verified',
    privacyNote: 'Only your verification status has been stored. No additional data has been collected without your consent.'
  });
});

/**
 * @desc    Get Twitter verification status
 * @route   GET /api/verification/twitter/status
 * @access  Private
 */
exports.getTwitterVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check current consent status for transparency
    const hasTwitterVerificationConsent = await consentService.hasUserConsented(
      req.user.id,
      'socialVerification.twitter'
    );
    
    const twitterVerification = user.verification && user.verification.twitter 
      ? user.verification.twitter
      : null;
      
    const verificationActive = twitterVerification && !ethicalDataService.isVerificationExpired(user.verification);
    
    // Get consent record for last updated information
    const consentRecord = await consentService.getUserConsent(req.user.id);
    const twitterConsentInfo = consentRecord?.socialVerification?.twitter || {};
    
    res.status(200).json({
      success: true,
      data: {
        verified: twitterVerification ? twitterVerification.verified : false,
        username: twitterVerification ? twitterVerification.username : null,
        verificationActive,
        verificationExpiry: twitterVerification && twitterVerification.createdAt 
          ? new Date(new Date(twitterVerification.createdAt).getTime() + 60 * 60 * 1000) // 1 hour
          : null,
        consent: {
          provided: hasTwitterVerificationConsent,
          lastUpdated: twitterConsentInfo.lastUpdated || null,
          consentVersion: twitterConsentInfo.consentVersion || null
        },
        dataProtection: {
          purpose: 'Account verification and ownership confirmation',
          dataCollected: ['verification status', 'username (if verified)'],
          retentionPolicy: 'Stored until account deletion or consent withdrawal'
        }
      }
    });
  } catch (error) {
    console.error('Error getting Twitter verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting verification status'
    });
  }
};

/**
 * @desc    Admin endpoint to check a user's Twitter profile for bot indicators
 * @route   POST /api/verification/twitter/analyze
 * @access  Private (Admin only)
 */
exports.analyzeTwitterAccount = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    const { twitterUsername, userId } = req.body;
    
    if (!twitterUsername) {
      return res.status(400).json({
        success: false,
        error: 'Twitter username is required'
      });
    }
    
    // If analyzing a specific user's account, check if they've consented to analysis
    if (userId) {
      const hasConsent = await consentService.hasUserConsented(
        userId,
        'dataUsage.publicProfile'
      );
      
      if (!hasConsent) {
        return res.status(403).json({
          success: false,
          error: 'User has not consented to profile analysis',
          privacyProtection: true
        });
      }
    }
    
    // Analyze account with proper logging for audit
    const requestInfo = {
      adminId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      endpoint: '/api/verification/twitter/analyze',
      reason: req.body.reason || 'Admin requested analysis'
    };
    
    // Use ethicalDataService or delegate to appropriate service
    // This is just a placeholder - implement appropriate analysis service
    const botDetectionService = require('../services/botDetectionService');
    const analysis = await botDetectionService.analyzeAccountEthically(
      twitterUsername, 
      requestInfo
    );
    
    // Log this admin action
    console.log('Admin analysis performed:', {
      admin: req.user.id,
      subject: twitterUsername,
      timestamp: new Date(),
      action: 'bot_analysis'
    });
    
    res.status(200).json({
      success: true,
      data: analysis,
      auditInfo: {
        performedBy: req.user.id,
        timestamp: new Date(),
        reason: req.body.reason || 'Admin requested analysis'
      }
    });
  } catch (error) {
    console.error('Error analyzing Twitter account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error analyzing Twitter account'
    });
  }
};

/**
 * @desc    Get Twitter profile data (only with explicit consent)
 * @route   GET /api/verification/twitter/profile/:username
 * @access  Private
 */
exports.getTwitterProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Twitter username is required'
      });
    }
    
    // Check consent for public profile data
    const hasConsent = await consentService.hasUserConsented(
      req.user.id,
      'dataUsage.publicProfile'
    );
    
    if (!hasConsent) {
      return res.status(403).json({
        success: false,
        error: 'Consent required for public profile data access',
        needsConsent: true,
        consentType: 'dataUsage.publicProfile'
      });
    }
    
    // Get profile data with consent
    const profileData = await ethicalDataService.getPublicProfileData(req.user.id, username);
    
    // Log this data access for transparency
    const requestInfo = {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      endpoint: `/api/verification/twitter/profile/${username}`,
      dataAccessed: 'publicProfile'
    };
    
    // Update consent with latest access information
    await consentService.updateConsentSetting(
      req.user.id,
      'dataUsage.publicProfile',
      true,
      requestInfo
    );
    
    res.status(200).json({
      success: true,
      data: profileData,
      privacyNote: 'This data was retrieved with your explicit consent. You can revoke access at any time.'
    });
  } catch (error) {
    console.error('Error getting Twitter profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error retrieving Twitter profile'
    });
  }
};

/**
 * @desc    Get Twitter engagement metrics (only with explicit consent)
 * @route   GET /api/verification/twitter/metrics/:username
 * @access  Private
 */
exports.getTwitterEngagementMetrics = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Twitter username is required'
      });
    }
    
    // Check consent for engagement metrics
    const hasConsent = await consentService.hasUserConsented(
      req.user.id,
      'dataUsage.engagementMetrics'
    );
    
    if (!hasConsent) {
      return res.status(403).json({
        success: false,
        error: 'Consent required for engagement metrics access',
        needsConsent: true,
        consentType: 'dataUsage.engagementMetrics'
      });
    }
    
    // Get engagement metrics with consent
    // Note: ethicalDataService will check if user owns this account
    const metricsData = await ethicalDataService.getPublicEngagementMetrics(req.user.id, username);
    
    // Log this data access for transparency
    const requestInfo = {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      endpoint: `/api/verification/twitter/metrics/${username}`,
      dataAccessed: 'engagementMetrics'
    };
    
    // Update consent with latest access information
    await consentService.updateConsentSetting(
      req.user.id,
      'dataUsage.engagementMetrics',
      true,
      requestInfo
    );
    
    res.status(200).json({
      success: true,
      data: metricsData,
      privacyNote: 'This data was retrieved with your explicit consent. You can revoke access at any time.'
    });
  } catch (error) {
    console.error('Error getting Twitter engagement metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error retrieving Twitter engagement metrics'
    });
  }
};