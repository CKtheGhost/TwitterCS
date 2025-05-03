/**
 * Authentication Routes
 * 
 * Routes for user authentication and account management with consent integration
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, recordLogin, requireConsentSetup } = require('../middleware/auth');
const { logDataAccess } = require('../middleware/consent');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes - require authentication
router.get('/me', 
  protect, 
  recordLogin, // Record user login with consent
  logDataAccess('user_profile'), 
  authController.getMe
);

// Sensitive operations - require consent setup
router.put('/password', 
  protect, 
  requireConsentSetup, 
  authController.changePassword
);

router.delete('/account', 
  protect, 
  requireConsentSetup, 
  authController.deleteAccount
);

module.exports = router;