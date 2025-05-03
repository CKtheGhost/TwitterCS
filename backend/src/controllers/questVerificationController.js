/**
 * Quest Verification Controller
 * 
 * Handles HTTP requests related to verifying quest completions
 * using ethical data collection methods with explicit user consent.
 */
const User = require('../models/User');
const Quest = require('../models/Quest');
const QuestCompletion = require('../models/QuestCompletion');
const ethicalDataService = require('../services/ethicalDataService');
const consentService = require('../services/consentService');
const { asyncHandler, throwError } = require('../utils/errorHandler');

/**
 * @desc    Verify quest completion ethically
 * @route   POST /api/quests/verify
 * @access  Private
 */
exports.verifyQuestCompletion = asyncHandler(async (req, res) => {
  const { questId, platformData } = req.body;
  
  if (!questId) {
    throwError('Quest ID is required', 400, [{
      type: 'validation',
      code: 'missing_field',
      field: 'questId',
      message: 'The quest ID field is required for verification'
    }]);
  }
  
  // Get quest details
  const quest = await Quest.findById(questId);
  if (!quest) {
    throwError('Quest not found', 404, [{
      type: 'resource',
      code: 'quest_not_found',
      message: `Quest with ID ${questId} does not exist`
    }]);
  }
  
  // Determine required consent category based on quest type
  let consentCategory;
  if (quest.platform === 'twitter') {
    if (['post', 'reply'].includes(quest.action)) {
      consentCategory = 'dataUsage.publicProfile';
    } else if (['like', 'retweet', 'follow'].includes(quest.action)) {
      consentCategory = 'dataUsage.engagementMetrics';
    }
  }
  
  // Check for proper consent
  if (consentCategory) {
    try {
      const hasConsent = await consentService.hasUserConsented(
        req.user.id,
        consentCategory
      );
      
      if (!hasConsent) {
        throwError('Consent required for quest verification', 403, [{
          type: 'consent',
          code: 'consent_required',
          consentType: consentCategory,
          message: `This quest requires verification of your ${quest.platform} ${quest.action} actions`,
          details: {
            needsConsent: true,
            consentType: consentCategory,
            consentReason: `This quest requires verification of your ${quest.platform} ${quest.action} actions.`
          }
        }]);
      }
    } catch (error) {
      throwError('Error checking consent status', 500, [{
        type: 'service',
        code: 'consent_service_error', 
        message: error.message || 'Failed to verify user consent status'
      }]);
    }
  }
  
  // Check if user has verified accounts
  try {
    const user = await User.findById(req.user.id);
    if (quest.platform === 'twitter' && 
        (!user.verification || !user.verification.twitter || !user.verification.twitter.verified)) {
      throwError('Twitter account verification required', 400, [{
        type: 'verification',
        code: 'account_verification_required',
        platform: 'twitter',
        message: 'You must first verify your Twitter account to complete this quest',
        details: {
          verificationRequired: true,
          platform: 'twitter'
        }
      }]);
    }
  } catch (error) {
    if (error.isOperational) {
      throw error;
    }
    
    throwError('Error retrieving user information', 500, [{
      type: 'database',
      code: 'user_retrieval_error',
      message: 'Could not retrieve user verification status'
    }]);
  }
  
  // Prepare quest data for verification
  const questData = {
    questId: quest._id,
    questType: `${quest.platform}_${quest.action}`,
    contentRequirement: quest.requirements.contentMatch,
    targetUrl: quest.requirements.targetUrl,
    completionCriteria: quest.requirements,
    ...platformData
  };
  
  // Perform ethical verification with fallback
  let verification;
  try {
    verification = await ethicalDataService.verifyQuestCompletion(
      req.user.id,
      questData
    );
  } catch (error) {
    // Handle specific API errors with fallbacks
    if (error.message.includes('rate limit')) {
      throwError('API rate limit exceeded', 429, [{
        type: 'rate_limit',
        code: 'api_rate_limit',
        message: 'External API rate limit reached. Please try again later.',
        retryAfter: '60'
      }]);
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      throwError('Network error during verification', 503, [{
        type: 'service',
        code: 'network_error',
        message: 'Network error occurred while verifying quest completion. Please try again.',
        retryable: true
      }]);
    } else {
      throwError('Verification service error', 500, [{
        type: 'service', 
        code: 'verification_service_error',
        message: error.message || 'Error occurred during verification'
      }]);
    }
  }
  
  if (!verification.verified) {
    throwError('Quest completion could not be verified', 400, [{
      type: 'verification',
      code: 'verification_failed',
      message: 'The quest completion could not be verified with the provided data',
      details: verification.verificationData,
      suggestions: [
        'Make sure you completed the quest requirements exactly as specified',
        'Verify your social account is public during verification',
        'Try completing the quest again and then verify'
      ]
    }]);
  }
  
  // Record successful completion with error handling
  let completion;
  try {
    completion = new QuestCompletion({
      user: req.user.id,
      quest: quest._id,
      verificationData: {
        method: verification.verificationData.type,
        timestamp: verification.verificationData.timestamp,
        completedAt: new Date()
      },
      rewards: quest.rewards
    });
    
    await completion.save();
  } catch (error) {
    throwError('Failed to save quest completion', 500, [{
      type: 'database',
      code: 'completion_save_error',
      message: 'Your completion was verified but there was an error saving it'
    }]);
  }
  
  // Log completion with proper audit trail
  const requestInfo = {
    userId: req.user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    endpoint: '/api/quests/verify',
    questId: quest._id
  };
  
  // Update user's completed quests with fallback retry mechanism 
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { completedQuests: quest._id }
    });
  } catch (error) {
    // This error should not prevent the success response, as the completion
    // was already saved. Log the error but continue.
    console.error('Error updating user completed quests:', error);
    // Implement a background retry mechanism in a production system
  }
  
  return res.status(200).json({
    success: true,
    message: 'Quest completion verified!',
    rewards: quest.rewards,
    completionId: completion._id,
    privacyNote: 'Verification data is minimal and only used to confirm completion'
  });
});

/**
 * @desc    Get user's quest completion history
 * @route   GET /api/quests/completions
 * @access  Private
 */
exports.getQuestCompletions = asyncHandler(async (req, res) => {
  // Add support for pagination and filtering
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const platform = req.query.platform;
  
  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throwError('Invalid pagination parameters', 400, [{
      type: 'validation',
      code: 'invalid_parameters',
      message: 'Page must be >= 1 and limit must be between 1-100'
    }]);
  }
  
  // Build query filters
  const query = { user: req.user.id };
  
  // Add platform filter if provided
  if (platform) {
    // Need to populate quest first to filter by platform
    query['quest.platform'] = platform;
  }
  
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination info
    const total = await QuestCompletion.countDocuments(query);
    
    // Get only minimal completion data (no verification details)
    const completions = await QuestCompletion.find(query)
      .select('quest rewards verificationData.completedAt')
      .populate('quest', 'title description platform action')
      .sort({ 'verificationData.completedAt': -1 })
      .skip(skip)
      .limit(limit);
    
    // If platform filter was specified, filter in-memory after population
    let filteredCompletions = completions;
    if (platform) {
      filteredCompletions = completions.filter(c => 
        c.quest && c.quest.platform === platform
      );
    }
    
    return res.status(200).json({
      success: true,
      count: filteredCompletions.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: filteredCompletions
    });
  } catch (error) {
    // Handle specific database errors
    if (error.name === 'CastError') {
      throwError('Invalid query parameter', 400, [{
        type: 'validation',
        code: 'invalid_parameter',
        field: error.path,
        message: `Invalid value for ${error.path}: ${error.value}`
      }]);
    }
    
    throwError('Failed to retrieve quest completion history', 500, [{
      type: 'database',
      code: 'retrieval_error',
      message: error.message || 'Error accessing completion records'
    }]);
  }
});

/**
 * @desc    Get available quests that user can complete
 * @route   GET /api/quests/available
 * @access  Private
 */
exports.getAvailableQuests = asyncHandler(async (req, res) => {
  let user;
  
  // Add support for filtering by platform and quest type
  const platform = req.query.platform;
  const questType = req.query.type;
  const season = req.query.season ? parseInt(req.query.season) : undefined;
  
  // Validate season parameter if provided
  if (req.query.season && (isNaN(season) || season < 1)) {
    throwError('Invalid season parameter', 400, [{
      type: 'validation',
      code: 'invalid_parameter',
      field: 'season',
      message: 'Season must be a positive number'
    }]);
  }
  
  try {
    // Get user data - with fallback in case of temporary database issues
    try {
      user = await User.findById(req.user.id);
      if (!user) {
        throwError('User not found', 404, [{
          type: 'resource',
          code: 'user_not_found',
          message: 'Unable to find user profile'
        }]);
      }
    } catch (error) {
      // If there's a database error, use a minimal user object with defaults
      // This allows users to at least see base quests, even if we can't
      // personalize the list right now
      console.error('Error retrieving user data, using fallback:', error);
      user = {
        _id: req.user.id,
        completedQuests: [],
        verification: {}
      };
    }
    
    const completedQuestIds = user.completedQuests || [];
    
    // Determine eligibility based on user's verification status
    const verifiedPlatforms = [];
    if (user.verification?.twitter?.verified) {
      verifiedPlatforms.push('twitter');
    }
    
    // Build query
    const query = {
      active: true,
      _id: { $nin: completedQuestIds }
    };
    
    // Add platform filter if provided by user or from verification status
    if (platform) {
      // If user specifically requests a platform, check verification
      if (platform !== 'none' && !verifiedPlatforms.includes(platform)) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: `You need to verify your ${platform} account to see these quests`,
          verifiedPlatforms,
          verificationNeeded: platform
        });
      }
      query.platform = platform;
    } else {
      // Default behavior - only show quests for verified platforms
      query.platform = { $in: verifiedPlatforms.length ? verifiedPlatforms : ['none'] };
    }
    
    // Add quest type filter if provided
    if (questType) {
      query.action = questType;
    }
    
    // Add season filter if provided
    if (season) {
      query.season = season;
    }
    
    // Get quests with proper error handling
    let quests;
    try {
      quests = await Quest.find(query);
    } catch (error) {
      throwError('Error retrieving quests', 500, [{
        type: 'database',
        code: 'quest_retrieval_error',
        message: error.message || 'Failed to query quest database'
      }]);
    }
    
    // Fetch user consent data in parallel for efficiency
    let userConsents = [];
    try {
      userConsents = await consentService.getUserConsentStatus(req.user.id);
    } catch (error) {
      // If consent service is unavailable, we'll show quests but mark all as requiring consent
      console.error('Error retrieving consent data, using fallback:', error);
    }
    
    // Create a quick lookup map of consent statuses
    const consentMap = {};
    userConsents.forEach(consent => {
      consentMap[consent.type] = consent.status === 'granted';
    });
    
    // Add privacy and consent requirements to each quest
    const questsWithConsentInfo = quests.map(quest => {
      const consentRequirements = [];
      let hasAllRequiredConsents = true;
      
      // Determine required consent based on quest type
      if (quest.platform === 'twitter') {
        if (['post', 'reply'].includes(quest.action)) {
          const consentType = 'dataUsage.publicProfile';
          consentRequirements.push(consentType);
          if (!consentMap[consentType]) {
            hasAllRequiredConsents = false;
          }
        } else if (['like', 'retweet', 'follow'].includes(quest.action)) {
          const consentType = 'dataUsage.engagementMetrics';
          consentRequirements.push(consentType);
          if (!consentMap[consentType]) {
            hasAllRequiredConsents = false;
          }
        }
      }
      
      return {
        ...quest.toObject(),
        privacyRequirements: {
          requiresVerification: quest.platform !== 'none',
          requiredConsent: consentRequirements,
          dataPurpose: 'Quest completion verification only'
        },
        userEligibility: {
          hasRequiredVerification: quest.platform === 'none' || verifiedPlatforms.includes(quest.platform),
          hasRequiredConsents: hasAllRequiredConsents,
          isReady: (quest.platform === 'none' || verifiedPlatforms.includes(quest.platform)) && hasAllRequiredConsents
        }
      };
    });
    
    return res.status(200).json({
      success: true,
      count: questsWithConsentInfo.length,
      data: questsWithConsentInfo,
      verifiedPlatforms,
      filters: {
        platform,
        questType,
        season
      }
    });
  } catch (error) {
    // If error is already a custom APIError, it will be caught by asyncHandler
    if (error.isOperational) {
      throw error;
    }
    
    throwError('Failed to retrieve available quests', 500, [{
      type: 'service',
      code: 'quest_listing_error',
      message: error.message || 'An error occurred while retrieving available quests'
    }]);
  }
});

module.exports = exports;