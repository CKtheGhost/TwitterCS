const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Content body is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  contentType: {
    type: String,
    enum: ['post', 'article', 'image', 'video'],
    default: 'post'
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  contentHash: {
    type: String,
    default: ''
  },
  onChainId: {
    type: Number,
    default: 0
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
ContentSchema.index({ creator: 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ engagementScore: -1 });

// Virtual for likes
ContentSchema.virtual('likes', {
  ref: 'Engagement',
  localField: '_id',
  foreignField: 'content',
  count: true,
  match: { engagementType: 'like' }
});

// Virtual for comments
ContentSchema.virtual('comments', {
  ref: 'Engagement',
  localField: '_id',
  foreignField: 'content',
  match: { engagementType: 'comment' }
});

// Virtual for shares
ContentSchema.virtual('shares', {
  ref: 'Engagement',
  localField: '_id',
  foreignField: 'content',
  count: true,
  match: { engagementType: 'share' }
});

module.exports = mongoose.model('Content', ContentSchema);