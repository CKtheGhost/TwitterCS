/**
 * Consent Controller
 * 
 * Handles API endpoints for user consent management
 */
const consentService = require('../services/consentService');
const { validationResult } = require('express-validator');

/**
 * Get current consent settings for user
 * @route GET /api/consent
 */
exports.getConsentSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const consentSettings = await consentService.getUserConsent(userId);
    
    // Format response for client
    const formattedSettings = {
      socialVerification: consentSettings.socialVerification,
      dataUsage: consentSettings.dataUsage,
      communications: consentSettings.communications,
      marketing: consentSettings.marketing,
      dataExport: {
        lastRequested: consentSettings.dataExport?.lastRequested,
        lastCompleted: consentSettings.dataExport?.lastCompleted
      },
      dataDeletion: {
        status: consentSettings.dataDeletion?.status,
        requestedAt: consentSettings.dataDeletion?.requestedAt
      }
    };
    
    res.status(200).json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Error retrieving consent settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve consent settings'
    });
  }
};

/**
 * Update a specific consent setting
 * @route PUT /api/consent/:category
 */
exports.updateConsent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const userId = req.user.id;
    const consentCategory = req.params.category;
    const { enabled } = req.body;
    
    // Get request info for audit
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Update the consent setting
    const updatedConsent = await consentService.updateConsentSetting(
      userId,
      consentCategory,
      enabled,
      requestInfo
    );
    
    res.status(200).json({
      success: true,
      message: `Consent for ${consentCategory} ${enabled ? 'granted' : 'revoked'}`,
      data: {
        category: consentCategory,
        enabled: enabled
      }
    });
  } catch (error) {
    console.error('Error updating consent setting:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update consent setting'
    });
  }
};

/**
 * Request data export
 * @route POST /api/consent/export
 */
exports.requestDataExport = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get request info for audit
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    await consentService.requestDataExport(userId, requestInfo);
    
    res.status(200).json({
      success: true,
      message: 'Data export request received',
      data: {
        status: 'pending',
        requestedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error requesting data export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process data export request'
    });
  }
};

/**
 * Request account deletion
 * @route POST /api/consent/delete
 */
exports.requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get request info for audit
    const requestInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    await consentService.requestDataDeletion(userId, requestInfo);
    
    res.status(200).json({
      success: true,
      message: 'Account deletion request received',
      data: {
        status: 'pending',
        requestedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process account deletion request'
    });
  }
};

/**
 * Get consent audit trail
 * @route GET /api/consent/audit
 */
exports.getConsentAudit = async (req, res) => {
  try {
    const userId = req.user.id;
    const auditTrail = await consentService.getConsentAuditTrail(userId);
    
    res.status(200).json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Error retrieving consent audit trail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve consent audit history'
    });
  }
};