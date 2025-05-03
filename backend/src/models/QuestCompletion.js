const mongoose = require('mongoose');

const QuestCompletionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    required: true
  },
  season: {
    type: Number,
    required: true
  },
  // Verification data that respects privacy
  verificationData: {
    method: {
      type: String,
      enum: ['api', 'proof', 'admin', 'smart_contract'],
      default: 'api'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    // Only storing minimal verification data
    platform: {
      type: String,
      enum: ['twitter', 'discord', 'web', 'none'],
      default: 'none'
    },
    // Anonymized proof reference (not actual content)
    proofReference: String,
    // Metadata for verification (not actual content)
    metadata: {
      type: Map,
      of: String
    }
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  validatedBy: {
    type: String,
    enum: ['system', 'admin', 'user', 'smart-contract'],
    default: 'system'
  },
  validatedAt: Date,
  rejectionReason: String,
  transactionHash: String,  // For blockchain-validated quests
  
  // Fields for audit and transparency (with consent)
  auditInfo: {
    consentProvided: {
      type: Boolean,
      default: false
    },
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserConsent'
    },
    privacyVersion: String,
    // IP and user agent are only stored with explicit consent
    ipAddress: {
      type: String,
      select: false  // Not included in regular queries
    },
    userAgent: {
      type: String,
      select: false  // Not included in regular queries
    }
  },
  
  isValid: {
    type: Boolean,
    default: true
  },
  
  // Bot detection only enabled with explicit consent
  botDetectionEnabled: {
    type: Boolean,
    default: false
  },
  botDetectionResult: {
    score: Number,
    isSuspicious: Boolean,
    reason: String
  },
  
  // Rewards tracking
  rewards: {
    tokenAmount: {
      type: Number,
      default: 0
    },
    nftId: String,
    xpPoints: {
      type: Number,
      default: 0
    }
  },
  
  // Data retention settings
  dataRetention: {
    expiresAt: Date,  // When verification data should be anonymized
    isAnonymized: {
      type: Boolean,
      default: false
    },
    anonymizedAt: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can't complete the same quest multiple times in a day
QuestCompletionSchema.index({ 
  user: 1, 
  quest: 1, 
  'verificationData.completedAt': 1 
}, { 
  unique: true,
  partialFilterExpression: { isValid: true }
});

// Index for data retention queries
QuestCompletionSchema.index({ 'dataRetention.expiresAt': 1 });

/**
 * Pre-save middleware to set data retention expiry date
 */
QuestCompletionSchema.pre('save', function(next) {
  if (!this.dataRetention.expiresAt) {
    // Default data retention period from environment or set to 2 years
    const retentionDays = process.env.DATA_RETENTION_DAYS || 730; // 2 years
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(retentionDays));
    this.dataRetention.expiresAt = expiryDate;
  }
  next();
});

/**
 * Static method to anonymize expired verification data
 * Used by scheduled job
 */
QuestCompletionSchema.statics.anonymizeExpiredData = async function() {
  const now = new Date();
  
  // Find all completions with expired retention that haven't been anonymized
  const expiredCompletions = await this.find({
    'dataRetention.expiresAt': { $lt: now },
    'dataRetention.isAnonymized': false
  });
  
  console.log(`Found ${expiredCompletions.length} quest completions to anonymize`);
  
  // Anonymize each completion
  for (const completion of expiredCompletions) {
    // Keep only essential data, anonymize the rest
    if (completion.auditInfo) {
      completion.auditInfo.ipAddress = undefined;
      completion.auditInfo.userAgent = undefined;
    }
    
    // Anonymize or clear sensitive verification data
    if (completion.verificationData) {
      completion.verificationData.proofReference = undefined;
      completion.verificationData.metadata = undefined;
    }
    
    // Mark as anonymized
    completion.dataRetention.isAnonymized = true;
    completion.dataRetention.anonymizedAt = now;
    
    await completion.save();
  }
  
  return expiredCompletions.length;
};

module.exports = mongoose.model('QuestCompletion', QuestCompletionSchema);