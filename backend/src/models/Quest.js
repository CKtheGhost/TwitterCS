const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quest title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Quest description is required']
  },
  type: {
    type: String,
    enum: ['post', 'comment', 'like', 'share', 'follow', 'invite'],
    required: [true, 'Quest type is required']
  },
  // Added platform field to support ethical verification
  platform: {
    type: String,
    enum: ['twitter', 'discord', 'web', 'none'],
    default: 'none',
    required: [true, 'Platform is required']
  },
  // Updated action field (renamed from type)
  action: {
    type: String,
    enum: ['post', 'reply', 'like', 'retweet', 'follow', 'invite'],
    required: [true, 'Action is required']
  },
  points: {
    type: Number,
    required: [true, 'Points value is required'],
    min: [1, 'Points must be at least 1']
  },
  dailyLimit: {
    type: Number,
    required: [true, 'Daily limit is required'],
    min: [1, 'Daily limit must be at least 1']
  },
  requirements: {
    // Specific requirements based on quest type
    minWords: Number,             // For posts/comments
    minCharacters: Number,        // For posts/comments
    minFollowers: Number,         // For users to follow
    contentMatch: String,         // Specific content to match
    targetUrl: String,            // Target URL for actions
    hashtagRequirement: String    // Required hashtag
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  season: {
    type: Number,
    default: 1
  },
  validationRules: {
    requiresProof: {
      type: Boolean,
      default: false
    },
    proofType: {
      type: String,
      enum: ['screenshot', 'link', 'text', 'none'],
      default: 'none'
    },
    autoValidate: {
      type: Boolean,
      default: true
    }
  },
  // New field for ethical verification
  verificationMethod: {
    type: String,
    enum: ['ethical_api', 'user_proof', 'admin_review', 'none'],
    default: 'ethical_api'
  },
  // New field for privacy requirements
  privacyRequirements: {
    requiresVerification: {
      type: Boolean,
      default: false
    },
    requiredConsents: {
      type: [String],
      default: []
    },
    dataPurpose: {
      type: String,
      default: 'Quest completion verification only'
    },
    dataRetention: {
      type: String,
      default: 'Until quest status change or user data deletion request'
    }
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  rewards: {
    tokenAmount: {
      type: Number,
      default: 0
    },
    nftReward: {
      type: Boolean,
      default: false
    },
    nftId: String,
    xpPoints: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quest', QuestSchema);