const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');
const { validateTwitterUsername } = require('../middleware/validators');
const { checkConsent } = require('../middleware/consent');

/**
 * Twitter Verification Routes
 * All routes implement ethical data collection with explicit user consent
 */

// Verification process routes
router.post('/twitter/start', 
  protect, 
  validateTwitterUsername, 
  checkConsent('socialVerification.twitter'),
  verificationController.startTwitterVerification
);

router.post('/twitter/verify', 
  protect, 
  validateTwitterUsername, 
  checkConsent('socialVerification.twitter'),
  verificationController.verifyTwitterAccount
);

router.get('/twitter/status', 
  protect, 
  verificationController.getTwitterVerificationStatus
);

// Data access routes (all require appropriate consent)
router.get('/twitter/profile/:username', 
  protect, 
  validateTwitterUsername,
  checkConsent('dataUsage.publicProfile'),
  verificationController.getTwitterProfile
);

router.get('/twitter/metrics/:username', 
  protect, 
  validateTwitterUsername,
  checkConsent('dataUsage.engagementMetrics'),
  verificationController.getTwitterEngagementMetrics
);

// Admin routes
router.post('/twitter/analyze', 
  protect, 
  authorize('admin'), 
  validateTwitterUsername, 
  verificationController.analyzeTwitterAccount
);

/**
 * Quest Verification Routes
 * Used to verify quest completion using ethical methods
 */
// Will be implemented in future updates

module.exports = router;