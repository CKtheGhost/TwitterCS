/**
 * Quest Controller
 * 
 * Handles HTTP requests related to quests
 */
const Quest = require('../models/Quest');
const QuestCompletion = require('../models/QuestCompletion');
const questService = require('../services/questService');
const botDetectionService = require('../services/botDetectionService');
const { asyncHandler, throwError } = require('../utils/errorHandler');

/**
 * @desc    Get all quests
 * @route   GET /api/quests
 * @access  Public
 */
exports.getQuests = asyncHandler(async (req, res) => {
  const quests = await Quest.find({ isActive: true })
    .sort({ points: -1 })
    .select('-__v');
  
  res.status(200).json({
    success: true,
    count: quests.length,
    data: quests
  });
});

/**
 * @desc    Get a single quest
 * @route   GET /api/quests/:id
 * @access  Public
 */
exports.getQuest = asyncHandler(async (req, res) => {
  const quest = await Quest.findById(req.params.id).select('-__v');
  
  if (!quest) {
    throwError('Quest not found', 404, [{
      type: 'resource',
      code: 'not_found',
      message: `Quest with ID ${req.params.id} was not found`
    }]);
  }
  
  res.status(200).json({
    success: true,
    data: quest
  });
});

/**
 * @desc    Create a new quest
 * @route   POST /api/quests
 * @access  Private (Admin only)
 */
exports.createQuest = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throwError('Not authorized to create quests', 403, [{
      type: 'authorization',
      code: 'insufficient_permissions',
      message: 'Only administrators can create quests'
    }]);
  }
  
  try {
    const quest = await questService.createQuest(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: quest
    });
  } catch (error) {
    // Handle specific validation errors from the service
    if (error.message.includes('validation')) {
      throwError('Quest validation failed', 400, [{
        type: 'validation',
        code: 'invalid_input',
        message: error.message
      }]);
    }
    
    // Re-throw other errors to be caught by asyncHandler
    throw error;
  }
});

/**
 * @desc    Update a quest
 * @route   PUT /api/quests/:id
 * @access  Private (Admin only)
 */
exports.updateQuest = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throwError('Not authorized to update quests', 403, [{
      type: 'authorization',
      code: 'insufficient_permissions',
      message: 'Only administrators can update quests'
    }]);
  }
  
  // First check if quest exists
  const quest = await Quest.findById(req.params.id);
  
  if (!quest) {
    throwError('Quest not found', 404, [{
      type: 'resource',
      code: 'not_found',
      message: `Quest with ID ${req.params.id} was not found`
    }]);
  }
  
  // Update quest
  try {
    const updatedQuest = await Quest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: updatedQuest
    });
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        code: 'validation_error'
      }));
      
      throwError('Validation failed', 400, validationErrors);
    }
    
    // Re-throw other errors to be caught by asyncHandler
    throw error;
  }
});

/**
 * @desc    Delete a quest
 * @route   DELETE /api/quests/:id
 * @access  Private (Admin only)
 */
exports.deleteQuest = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throwError('Not authorized to delete quests', 403, [{
      type: 'authorization',
      code: 'insufficient_permissions',
      message: 'Only administrators can delete quests'
    }]);
  }
  
  const quest = await Quest.findById(req.params.id);
  
  if (!quest) {
    throwError('Quest not found', 404, [{
      type: 'resource',
      code: 'not_found',
      message: `Quest with ID ${req.params.id} was not found`
    }]);
  }
  
  // Instead of actually deleting, just deactivate
  quest.isActive = false;
  await quest.save();
  
  res.status(200).json({
    success: true,
    data: {},
    message: 'Quest successfully deactivated'
  });
});

/**
 * @desc    Get available quests for current user
 * @route   GET /api/quests/available
 * @access  Private
 */
exports.getAvailableQuests = asyncHandler(async (req, res) => {
  // Use default season 1 for now, in a real app this would be dynamic
  const season = req.query.season ? parseInt(req.query.season) : 1;
  
  // Validate season if provided in query
  if (req.query.season && isNaN(season)) {
    throwError('Invalid season value', 400, [{
      type: 'validation',
      code: 'invalid_parameter',
      field: 'season',
      message: 'Season must be a valid number'
    }]);
  }
  
  try {
    const quests = await questService.getAvailableQuests(req.user.id, season);
    
    res.status(200).json({
      success: true,
      count: quests.length,
      data: quests
    });
  } catch (error) {
    // More specific error for service issues
    throwError(
      'Failed to retrieve available quests', 
      500, 
      [{
        type: 'service',
        code: 'service_unavailable',
        message: error.message || 'Error retrieving quests from database'
      }]
    );
  }
});

/**
 * @desc    Complete a quest
 * @route   POST /api/quests/:id/complete
 * @access  Private
 */
exports.completeQuest = asyncHandler(async (req, res) => {
  // Collect IP and user agent for fraud detection
  const proofData = {
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  // Check if user is potentially a bot or has been flagged
  const shouldThrottle = await botDetectionService.shouldThrottleUser(req.user.id);
  if (shouldThrottle) {
    throwError('Too many requests. Please try again later.', 429, [{
      type: 'rate_limit',
      code: 'too_many_requests',
      message: 'Action blocked due to suspicious activity',
      retryAfter: '300' // 5 minutes suggestion
    }]);
  }
  
  try {
    const result = await questService.validateQuestCompletion(
      req.params.id,
      req.user.id,
      proofData
    );
    
    if (!result.success) {
      // Parse the validation failure reason
      let errorCode = 'validation_failed';
      let errorType = 'validation';
      
      // Determine more specific error info from the message
      if (result.message?.includes('not found') || result.message?.includes('inactive')) {
        errorCode = 'quest_not_found';
        errorType = 'resource';
      } else if (result.message?.includes('daily limit')) {
        errorCode = 'daily_limit_reached';
        errorType = 'limit';
      } else if (result.message?.includes('rate limit')) {
        errorCode = 'rate_limited';
        errorType = 'rate_limit';
      }
      
      throwError(result.message, 400, [{
        type: errorType,
        code: errorCode,
        message: result.message
      }]);
    }
    
    res.status(200).json({
      success: true,
      data: {
        pointsEarned: result.pointsEarned,
        requiresReview: result.requiresReview,
        completionId: result.completion._id
      }
    });
  } catch (error) {
    // If the error is already a custom APIError, it will be caught by asyncHandler
    if (error.isOperational) {
      throw error;
    }
    
    // Otherwise create a more informative error
    throwError(
      'Failed to complete quest', 
      500, 
      [{
        type: 'service',
        code: 'quest_completion_failed',
        message: error.message || 'Error completing quest'
      }]
    );
  }
});

/**
 * @desc    Get user's quest completions
 * @route   GET /api/quests/completions
 * @access  Private
 */
exports.getQuestCompletions = asyncHandler(async (req, res) => {
  // Add query params for pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throwError('Invalid pagination parameters', 400, [{
      type: 'validation',
      code: 'invalid_parameters',
      message: 'Page and limit must be positive numbers, and limit cannot exceed 100'
    }]);
  }
  
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination data
    const total = await QuestCompletion.countDocuments({ user: req.user.id });
    
    // Get completions with pagination
    const completions = await QuestCompletion.find({ user: req.user.id })
      .sort({ completedAt: -1 })
      .populate('quest', 'title type points')
      .select('-__v -ipAddress -userAgent')
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: completions.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: completions
    });
  } catch (error) {
    throwError('Failed to retrieve quest completions', 500, [{
      type: 'service',
      code: 'database_error',
      message: 'Error retrieving quest completion history'
    }]);
  }
});

/**
 * @desc    Get user's quest statistics
 * @route   GET /api/quests/stats
 * @access  Private
 */
exports.getQuestStats = asyncHandler(async (req, res) => {
  let season = null;
  
  // Validate season parameter if provided
  if (req.query.season) {
    season = parseInt(req.query.season);
    if (isNaN(season) || season < 1) {
      throwError('Invalid season parameter', 400, [{
        type: 'validation',
        code: 'invalid_parameter',
        field: 'season',
        message: 'Season must be a positive number'
      }]);
    }
  }
  
  try {
    const stats = await questService.getUserQuestStats(req.user.id, season);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    throwError('Failed to retrieve quest statistics', 500, [{
      type: 'service',
      code: 'stats_retrieval_failed',
      message: error.message || 'Error calculating quest statistics'
    }]);
  }
});