const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  walletAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null/undefined values to not count as duplicates
  },
  profilePicture: {
    type: String,
    default: 'default-profile.jpg'
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  tokenBalance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verification: {
    twitter: {
      username: String,
      userId: String,
      code: String,
      createdAt: Date,
      verifiedAt: Date,
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  botScore: {
    type: Number,
    default: 0,  // 0 = not a bot, closer to 1 = likely a bot
  },
  botCheckDate: Date,
  riskFactors: {
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    rapidActions: {
      type: Boolean,
      default: false
    },
    failedVerifications: {
      type: Number,
      default: 0
    },
  },
  accountStatus: {
    type: String,
    enum: ['active', 'flagged', 'suspended', 'banned', 'deleted'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String,
    success: Boolean
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
};

// Method to record login attempt
UserSchema.methods.recordLoginAttempt = async function(ip, userAgent, success) {
  this.loginHistory = this.loginHistory || [];
  
  // Add login attempt to history (limit to 10 entries)
  this.loginHistory.unshift({
    timestamp: new Date(),
    ip,
    userAgent,
    success
  });
  
  // Trim history to last 10 entries
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(0, 10);
  }
  
  // Update last login time if successful
  if (success) {
    this.lastLogin = new Date();
  }
  
  await this.save();
};

// Virtual for user's content
UserSchema.virtual('content', {
  ref: 'Content',
  localField: '_id',
  foreignField: 'creator'
});

module.exports = mongoose.model('User', UserSchema);