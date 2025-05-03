const mongoose = require('mongoose');

const EngagementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  engagementType: {
    type: String,
    enum: ['like', 'comment', 'share'],
    required: true
  },
  commentText: {
    type: String,
    required: function() {
      return this.engagementType === 'comment';
    },
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  onChainId: {
    type: Number,
    default: 0
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engagement',
    default: null // For nested comments/replies
  }
}, {
  timestamps: true
});

// Indexes for faster queries
EngagementSchema.index({ user: 1, content: 1, engagementType: 1 }, { unique: true });
EngagementSchema.index({ content: 1 });
EngagementSchema.index({ createdAt: -1 });

// Prevent duplicate likes
EngagementSchema.pre('save', async function(next) {
  if (this.isNew && this.engagementType === 'like') {
    const existingLike = await this.constructor.findOne({
      user: this.user,
      content: this.content,
      engagementType: 'like'
    });
    
    if (existingLike) {
      const error = new Error('User has already liked this content');
      error.name = 'DuplicateEngagementError';
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Engagement', EngagementSchema);