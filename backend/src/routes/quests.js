const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const questVerificationController = require('../controllers/questVerificationController');
const { protect, authorize } = require('../middleware/auth');
const { validateQuest, validateQuestCompletion } = require('../middleware/validators');
const { checkConsent, logDataAccess } = require('../middleware/consent');

/**
 * Quest Routes
 * Implements ethical data collection with explicit user consent
 */

// Public routes - basic quest information
router.get('/', questController.getQuests);
router.get('/:id', questController.getQuest);

// Available quests (with privacy requirements)
router.get('/available', protect, questVerificationController.getAvailableQuests);

// Quest verification routes
router.post('/verify', 
  protect, 
  validateQuestCompletion, 
  // Consent is checked inside the controller based on quest type
  logDataAccess('quest_verification'),
  questVerificationController.verifyQuestCompletion
);

// Quest completions history
router.get('/completions', 
  protect, 
  questVerificationController.getQuestCompletions
);

// Legacy routes (maintained for compatibility)
router.post('/:id/complete', protect, validateQuestCompletion, questController.completeQuest);
router.get('/stats', protect, questController.getQuestStats);

// Admin routes
router.post('/', 
  protect, 
  authorize('admin'), 
  validateQuest, 
  questController.createQuest
);

router.put('/:id', 
  protect, 
  authorize('admin'), 
  validateQuest, 
  questController.updateQuest
);

router.delete('/:id', 
  protect, 
  authorize('admin'), 
  questController.deleteQuest
);

module.exports = router;