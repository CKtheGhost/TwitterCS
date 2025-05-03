const mongoose = require('mongoose');

/**
 * Schema for managing user consent and data permissions
 * This enables explicit opt-in for different types of data collection and usage
 */
const UserConsentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Social account verification consent
  socialVerification: {
    twitter: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date,
      consentVersion: String
    }
  },
  // Data collection and usage consents
  dataUsage: {
    // User engagement metrics (likes, comments, shares)
    engagementMetrics: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    },
    // Public profile information
    publicProfile: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    },
    // On-chain activity monitoring
    onChainActivity: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    }
  },
  // Notification and communication preferences
  communications: {
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['never', 'daily', 'weekly', 'important'],
        default: 'important'
      },
      lastUpdated: Date
    },
    platform: {
      enabled: {
        type: Boolean,
        default: true
      },
      lastUpdated: Date
    }
  },
  // Marketing and analytics
  marketing: {
    analytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    },
    thirdParty: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    }
  },
  // Data export and deletion
  dataDeletion: {
    requestedAt: Date,
    completedAt: Date,
    status: {
      type: String,
      enum: ['none', 'pending', 'completed', 'denied'],
      default: 'none'
    }
  },
  // Data download/export
  dataExport: {
    lastRequested: Date,
    lastCompleted: Date,
    count: {
      type: Number,
      default: 0
    }
  },
  // Consent history for auditing
  consentHistory: [{
    action: {
      type: String,
      enum: ['grant', 'revoke', 'update', 'export', 'delete'],
      required: true
    },
    category: {
      type: String,
      required: true
    },
    value: Boolean,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Add index for faster lookups
UserConsentSchema.index({ user: 1 });

// Method to log consent changes
UserConsentSchema.methods.logConsentChange = function(action, category, value, requestInfo) {
  this.consentHistory.push({
    action,
    category,
    value,
    timestamp: new Date(),
    ipAddress: requestInfo?.ip || 'unknown',
    userAgent: requestInfo?.userAgent || 'unknown'
  });
};

// Method to check if user has consented to a specific category
UserConsentSchema.methods.hasConsented = function(category) {
  const [mainCategory, subCategory] = category.split('.');
  
  if (!this[mainCategory]) return false;
  
  if (subCategory) {
    return this[mainCategory][subCategory]?.enabled === true;
  }
  
  // If no subcategory, check if any subcategory is enabled
  return Object.values(this[mainCategory]).some(value => 
    typeof value === 'object' && value.enabled === true
  );
};

// Automatically set lastUpdated when consent is changed
UserConsentSchema.pre('save', function(next) {
  const updatedPaths = this.modifiedPaths();
  
  updatedPaths.forEach(path => {
    if (path.endsWith('.enabled')) {
      const lastUpdatedPath = path.replace('.enabled', '.lastUpdated');
      this.set(lastUpdatedPath, new Date());
    }
  });
  
  next();
});

module.exports = mongoose.model('UserConsent', UserConsentSchema);