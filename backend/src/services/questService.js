/**
 * Quest Service
 * 
 * Handles business logic for quests, including creation, validation, and completion.
 */
const Quest = require('../models/Quest');
const QuestCompletion = require('../models/QuestCompletion');
const User = require('../models/User');
const botDetectionService = require('./botDetectionService');
const web3Service = require('./web3Service');

/**
 * Create a new quest
 * @param {Object} questData - Quest data to create
 * @param {string} userId - User ID of the creator
 * @returns {Promise<Object>} Created quest
 */
exports.createQuest = async (questData, userId) => {
  try {
    const quest = new Quest({
      ...questData,
      createdBy: userId
    });
    
    return await quest.save();
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyValue)[0];
      throw new Error(`A quest with this ${field} already exists`);
    }
    throw error;
  }
};

/**
 * Get available quests for a user
 * @param {string} userId - User ID
 * @param {number} season - Season number
 * @returns {Promise<Array>} Available quests with completion status
 */
exports.getAvailableQuests = async (userId, season) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.code = 'INVALID_USER';
    throw error;
  }
  
  if (season !== undefined && (isNaN(season) || season < 1)) {
    const error = new Error('Invalid season number');
    error.code = 'INVALID_SEASON';
    throw error;
  }
  
  try {
    // Get quests for the season
    const questsPromise = Quest.find({ 
      isActive: true,
      ...(season && { season })
    }).timeout(5000);
    
    // Get user's completed quests for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completionsPromise = QuestCompletion.find({
      user: userId,
      'verificationData.completedAt': { $gte: today }
    }).timeout(5000);
    
    // Run both queries in parallel for better performance
    const [quests, completions] = await Promise.allSettled([
      questsPromise,
      completionsPromise
    ]);
    
    // Handle potential failures with fallbacks
    const questResults = quests.status === 'fulfilled' ? quests.value : [];
    let completionResults = [];
    
    if (completions.status === 'fulfilled') {
      completionResults = completions.value;
    } else {
      console.error('Error retrieving completions, using empty fallback:', completions.reason);
    }
    
    // If both queries failed, throw an error
    if (quests.status === 'rejected' && completions.status === 'rejected') {
      const error = new Error('Failed to retrieve quests and completions');
      error.code = 'DATABASE_TIMEOUT';
      error.isRetryable = true;
      throw error;
    }
    
    // Process quests to add completion info
    const availableQuests = questResults.map(quest => {
      const questObj = quest.toObject();
      
      // Count completions for this quest today
      const questCompletions = completionResults.filter(
        c => c.quest.toString() === quest._id.toString() && c.isValid
      );
      
      const completedToday = questCompletions.length;
      const dailyLimit = quest.dailyLimit || 1;
      const isCompletedToday = completedToday >= dailyLimit;
      
      return {
        ...questObj,
        completedToday,
        remainingToday: Math.max(0, dailyLimit - completedToday),
        isCompletedToday
      };
    });
    
    return availableQuests;
  } catch (error) {
    // Re-throw with additional context
    if (error.code) throw error;
    
    const enhancedError = new Error(`Error retrieving available quests: ${error.message}`);
    enhancedError.code = error.name === 'MongooseError' ? 'DATABASE_TIMEOUT' : 'QUEST_RETRIEVAL_ERROR';
    enhancedError.isRetryable = true;
    throw enhancedError;
  }
};

/**
 * Validate a quest completion
 * @param {string} questId - Quest ID
 * @param {string} userId - User ID
 * @param {Object} proofData - Data provided as proof of completion
 * @returns {Promise<Object>} Validation result
 */
exports.validateQuestCompletion = async (questId, userId, proofData) => {
  // First, check if the quest exists
  const quest = await Quest.findById(questId);
  
  if (!quest) {
    return {
      success: false,
      code: 'QUEST_NOT_FOUND',
      message: 'Quest not found'
    };
  }
  
  // Check if quest is active
  if (!quest.isActive) {
    return {
      success: false,
      code: 'QUEST_INACTIVE',
      message: 'This quest is currently inactive'
    };
  }
  
  try {
    // Get user info
    const user = await User.findById(userId);
    
    if (!user || user.accountStatus !== 'active') {
      return {
        success: false,
        code: 'INVALID_USER',
        message: 'User account is inactive or does not exist'
      };
    }
    
    // Check for rate limiting/bot detection
    const shouldThrottle = await botDetectionService.shouldThrottleUser(userId);
    if (shouldThrottle) {
      return {
        success: false,
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Please try again later.'
      };
    }
    
    // Check if daily limit reached
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completionsToday = await QuestCompletion.countDocuments({
      user: userId,
      quest: questId,
      'verificationData.completedAt': { $gte: today },
      isValid: true
    }).timeout(5000);
    
    if (completionsToday >= quest.dailyLimit) {
      return {
        success: false,
        code: 'DAILY_LIMIT_REACHED',
        message: 'You have reached the daily limit for this quest'
      };
    }
    
    // Validate quest completion based on type
    const typeValidation = await this.runQuestTypeValidation(quest, proofData);
    
    if (!typeValidation.isValid) {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        message: typeValidation.message || 'Failed to validate quest completion'
      };
    }
    
    // If we got here, the quest is completed successfully
    // Create completion record
    const completion = new QuestCompletion({
      user: userId,
      quest: questId,
      season: quest.season,
      verificationData: {
        method: typeValidation.requiresManualReview ? 'admin' : 'api',
        timestamp: new Date(),
        completedAt: new Date(),
        platform: quest.platform
      },
      pointsEarned: quest.points,
      status: typeValidation.requiresManualReview ? 'pending' : 'approved',
      isValid: true
    });
    
    // Monitor for potential bot activity
    await botDetectionService.monitorQuestCompletions(userId, questId, proofData);
    
    // Save the completion
    await completion.save();
    
    // If the platform supports it, validate on blockchain
    let blockchainValidated = false;
    let transactionHash = null;
    
    try {
      if (user.walletAddress && web3Service) {
        const txResult = await web3Service.completeQuest(
          user.walletAddress,
          questId, 
          quest.points
        );
        
        if (txResult.success) {
          blockchainValidated = true;
          transactionHash = txResult.transactionHash;
        }
      }
    } catch (error) {
      console.error('Blockchain validation failed:', error);
      // Continue without blockchain validation
    }
    
    return {
      success: true,
      pointsEarned: quest.points,
      requiresReview: typeValidation.requiresManualReview,
      completion,
      blockchainValidated,
      transactionHash
    };
  } catch (error) {
    console.error('Error validating quest completion:', error);
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'An error occurred while validating the quest'
    };
  }
};

/**
 * Validate quest completion based on quest type
 * @param {Object} quest - Quest object
 * @param {Object} proofData - Proof data provided by user
 * @returns {Promise<Object>} Validation result
 */
exports.runQuestTypeValidation = async (quest, proofData) => {
  // In a real implementation, this would contain type-specific validation logic
  // For testing, simply return success
  return {
    isValid: true,
    requiresManualReview: false
  };
};

/**
 * Calculate user's quest completion streak
 * @param {Array} completions - Array of completion objects
 * @returns {number} Current streak count
 */
exports.calculateStreak = (completions) => {
  if (!completions || completions.length === 0) {
    return 0;
  }
  
  // Sort by date descending
  const sortedCompletions = [...completions].sort((a, b) => {
    const dateA = new Date(a.completedAt || a.createdAt);
    const dateB = new Date(b.completedAt || b.createdAt);
    return dateB - dateA;
  });
  
  // Filter out invalid dates
  const validCompletions = sortedCompletions.filter(c => {
    const date = new Date(c.completedAt || c.createdAt);
    return !isNaN(date.getTime());
  });
  
  if (validCompletions.length === 0) {
    return 0;
  }
  
  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(validCompletions[0].completedAt || validCompletions[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < validCompletions.length; i++) {
    const completionDate = new Date(validCompletions[i].completedAt || validCompletions[i].createdAt);
    completionDate.setHours(0, 0, 0, 0);
    
    // Check if this completion was the previous day
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
      currentDate = completionDate;
    } else {
      // Break in the streak
      break;
    }
  }
  
  return streak;
};

/**
 * Get user's quest statistics
 * @param {string} userId - User ID
 * @param {number} season - Optional season filter
 * @returns {Promise<Object>} Quest statistics
 */
exports.getUserQuestStats = async (userId, season = null) => {
  try {
    const query = { user: userId };
    if (season) {
      query.season = season;
    }
    
    // Get all user's quest completions
    const completions = await QuestCompletion.find(query)
      .populate('quest', 'points')
      .sort({ 'verificationData.completedAt': -1 });
    
    // Calculate total points
    const totalPoints = completions.reduce((sum, completion) => {
      return sum + (completion.pointsEarned || 0);
    }, 0);
    
    // Calculate current streak
    const streak = this.calculateStreak(completions.map(c => ({
      completedAt: c.verificationData?.completedAt
    })));
    
    // Get unique quests completed
    const uniqueQuestIds = new Set();
    completions.forEach(completion => {
      if (completion.quest) {
        uniqueQuestIds.add(completion.quest._id.toString());
      }
    });
    
    return {
      totalPoints,
      completedQuests: uniqueQuestIds.size,
      totalCompletions: completions.length,
      currentStreak: streak,
      // Additional stats would be added in a real implementation
    };
  } catch (error) {
    console.error('Error retrieving user quest stats:', error);
    throw new Error(`Failed to retrieve quest statistics: ${error.message}`);
  }
};