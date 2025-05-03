/**
 * User Controller
 * 
 * Handles operations related to user accounts with consent integration
 */
const User = require('../models/User');
const UserConsent = require('../models/UserConsent');
const consentService = require('../services/consentService');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's consent settings
    const consentRecord = await UserConsent.findOne({ user: user._id });
    
    // Return user profile with consent status
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verification: {
          twitter: {
            verified: user.verification?.twitter?.verified || false,
            username: user.verification?.twitter?.username || null
          }
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      },
      consent: {
        initialized: !!consentRecord,
        socialVerification: consentRecord?.socialVerification,
        dataUsage: consentRecord?.dataUsage,
        communications: consentRecord?.communications,
        marketing: consentRecord?.marketing
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting user profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { username } = req.body;
    
    // Check if username is already taken
    if (username && username !== req.user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }
    
    // Update fields that are allowed to be updated
    const updatedFields = {};
    if (username) updatedFields.username = username;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );
    
    // Log the profile update for audit
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      endpoint: '/api/users/profile',
      updatedFields: Object.keys(updatedFields)
    };
    
    console.log('Profile updated:', {
      userId: req.user.id,
      action: 'profile_update',
      timestamp: new Date(),
      fields: Object.keys(updatedFields),
      requestInfo
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while updating user profile'
    });
  }
};

/**
 * @desc    Get user completion statistics
 * @route   GET /api/users/stats
 * @access  Private
 */
exports.getUserStats = async (req, res) => {
  try {
    // Check consent for analytics
    const hasConsent = await consentService.hasUserConsented(
      req.user.id,
      'marketing.analytics'
    );
    
    let analyticsEnabled = hasConsent;
    let stats = {
      questsCompleted: 0,
      totalPoints: 0,
      rank: null,
      progress: {
        level: 1,
        currentPoints: 0,
        nextLevelPoints: 100,
        percentage: 0
      },
      // Include minimal stats even without full analytics consent
      verificationStatus: {
        twitter: req.user.verification?.twitter?.verified || false
      }
    };
    
    // If user has consented to analytics, get more detailed stats
    if (analyticsEnabled) {
      // Query quest completions for this user
      // Include more detailed analytics like quest types, timeline, etc.
      // This would be implemented based on your specific analytics needs
    }
    
    res.status(200).json({
      success: true,
      analyticsEnabled,
      data: stats,
      // If analytics not enabled, include consent request information
      consent: !analyticsEnabled ? {
        required: 'marketing.analytics',
        message: 'Enable analytics consent to see detailed statistics'
      } : null
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting user statistics'
    });
  }
};

/**
 * @desc    Connect wallet to user account
 * @route   POST /api/users/wallet
 * @access  Private
 */
exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }
    
    // In a real implementation, verify the signature
    
    // Update user with wallet
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true }
    );
    
    // Check if user has consented to on-chain activity
    const hasConsent = await consentService.hasUserConsented(
      req.user.id,
      'dataUsage.onChainActivity'
    );
    
    res.status(200).json({
      success: true,
      data: {
        walletAddress: updatedUser.walletAddress,
        connectedAt: new Date()
      },
      consent: {
        onChainActivity: hasConsent,
        message: hasConsent 
          ? 'On-chain activity tracking is enabled' 
          : 'On-chain activity tracking requires consent'
      }
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while connecting wallet'
    });
  }
};

module.exports = exports;