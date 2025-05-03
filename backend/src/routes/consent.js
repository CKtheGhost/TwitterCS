/**
 * Consent Management Routes
 */
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const consentController = require('../controllers/consentController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET api/consent
 * @desc    Get all consent settings for the user
 * @access  Private
 */
router.get('/', consentController.getConsentSettings);

/**
 * @route   PUT api/consent/:category
 * @desc    Update a specific consent category
 * @access  Private
 */
router.put(
  '/:category',
  [
    check('enabled', 'Enabled flag is required').isBoolean(),
    check('category', 'Valid consent category required').isString().matches(
      /^(socialVerification|dataUsage|communications|marketing)\.[a-zA-Z]+\.?[a-zA-Z]*$/
    )
  ],
  consentController.updateConsent
);

/**
 * @route   POST api/consent/export
 * @desc    Request data export for user
 * @access  Private
 */
router.post('/export', consentController.requestDataExport);

/**
 * @route   POST api/consent/delete
 * @desc    Request account deletion
 * @access  Private
 */
router.post('/delete', consentController.requestAccountDeletion);

/**
 * @route   GET api/consent/audit
 * @desc    Get audit trail of consent changes
 * @access  Private
 */
router.get('/audit', consentController.getConsentAudit);

module.exports = router;