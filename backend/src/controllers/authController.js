/**
 * Authentication Controller
 * 
 * Handles authentication operations with consent integration
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserConsent = require('../models/UserConsent');
const consentService = require('../services/consentService');

/**
 * Get token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const getSignedJwtToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User with that email already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password, // Password will be hashed via pre-save hook in the User model
      role: 'user',
      verification: {
        twitter: {
          verified: false
        }
      },
      isVerified: false
    });
    
    // Initialize consent settings
    const consentRecord = await consentService.initializeConsent(user._id, {
      // Initialize with all consent opt-outs by default (privacy by default)
      // Platform notifications enabled by default for basic functionality
      communications: {
        platform: {
          enabled: true,
          lastUpdated: new Date()
        }
      }
    });
    
    // Generate JWT token
    const token = getSignedJwtToken(user);
    
    // Return token and user info
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      consent: {
        initialized: true,
        consentVersion: consentService.CONSENT_VERSION
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
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
    
    // Ensure user has a consent record
    let consentRecord = await UserConsent.findOne({ user: user._id });
    let consentInitialized = true;
    
    if (!consentRecord) {
      consentRecord = await consentService.initializeConsent(user._id);
      consentInitialized = false;
    }
    
    // Get consent status
    const consentInfo = {
      initialized: consentInitialized,
      consentVersion: consentService.CONSENT_VERSION,
      needsReview: consentRecord.needsReview || false
    };
    
    // Generate JWT token
    const token = getSignedJwtToken(user);
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Return token and user info
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        twitterVerified: user.verification?.twitter?.verified || false
      },
      consent: consentInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    
    // Get consent status
    const consentRecord = await UserConsent.findOne({ user: user._id });
    const consentInfo = consentRecord ? {
      initialized: true,
      consentVersion: consentService.CONSENT_VERSION,
      needsReview: consentRecord.needsReview || false
    } : {
      initialized: false,
      consentVersion: consentService.CONSENT_VERSION,
      needsReview: true
    };
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        twitterVerified: user.verification?.twitter?.verified || false,
        twitterUsername: user.verification?.twitter?.username || null,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      consent: consentInfo
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
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new passwords'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Log this security-sensitive action
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    };
    
    console.log(`Password changed for user ${user._id}`, {
      userId: user._id,
      action: 'password_change',
      timestamp: new Date(),
      requestInfo
    });
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while changing password'
    });
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist for security
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpire = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    
    // Save to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetExpire;
    await user.save();
    
    // In a real application, send email with reset link
    // For now, just log it
    console.log(`Password reset requested for ${user.email}. Token: ${resetToken}`);
    
    // Return response
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while requesting password reset'
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  // Implementation would go here - for brevity not included in this sample
  res.status(501).json({
    success: false,
    error: 'Not implemented yet'
  });
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if password matches
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Password is incorrect'
        });
      }
    }
    
    // Request data deletion through consent service for GDPR compliance
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      reason: req.body.reason || 'User requested account deletion'
    };
    
    await consentService.requestDataDeletion(req.user.id, requestInfo);
    
    // Mark user as deleted (soft delete)
    user.accountStatus = 'deleted';
    user.email = `deleted-${user._id}@deleted.com`;
    user.username = `deleted-${user._id}`;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Your account has been scheduled for deletion'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting your account'
    });
  }
};

module.exports = exports;