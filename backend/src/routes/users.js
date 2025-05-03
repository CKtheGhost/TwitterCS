/**
 * User Routes
 * 
 * Routes for user profile management and statistics
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { checkConsent, logDataAccess } = require('../middleware/consent');

// Profile routes - require authentication
router.get('/profile', protect, logDataAccess('user_profile'), userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);

// Stats routes - enhanced with consent
router.get('/stats', 
  protect, 
  logDataAccess('user_stats'),
  userController.getUserStats
);

// Wallet connection
router.post('/wallet', protect, userController.connectWallet);

// Admin routes
router.get('/', 
  protect, 
  authorize('admin'), 
  logDataAccess('admin_user_list'),
  (req, res) => {
    // This would be implemented in a real admin controller
    res.status(501).json({
      success: false,
      error: 'Not implemented yet'
    });
  }
);

module.exports = router;