/**
 * Simplified User Routes
 * 
 * Temporary simplified routes for initial setup
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-simple');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    username: 'user' + req.user.id.substring(0, 4),
    role: 'user',
    twitterVerified: true,
    walletVerified: true,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    questsCompleted: 5,
    engagementScore: 256
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, (req, res) => {
  const { username, bio, avatarUrl } = req.body;
  
  res.json({
    id: req.user.id,
    email: req.user.email,
    username: username || 'user' + req.user.id.substring(0, 4),
    bio: bio || 'No bio provided',
    avatarUrl: avatarUrl || 'https://example.com/default-avatar.png',
    role: 'user',
    message: 'Profile updated successfully'
  });
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', auth, (req, res) => {
  res.json({
    questsCompleted: 5,
    questsPending: 2,
    questsFailed: 1,
    engagementScore: 256,
    tokensEarned: 1500,
    badgesEarned: 3,
    leaderboardRank: 42,
    activity: [
      { type: 'quest_completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() }, // 2 days ago
      { type: 'token_earned', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() }, // 4 days ago
      { type: 'badge_earned', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() } // 7 days ago
    ]
  });
});

/**
 * @route   GET /api/users/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', auth, (req, res) => {
  res.json([
    {
      id: '1',
      type: 'quest_completed',
      message: 'You completed the Twitter engagement quest',
      read: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: '2',
      type: 'token_earned',
      message: 'You earned 100 tokens for community participation',
      read: true,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
    }
  ]);
});

/**
 * @route   PUT /api/users/notifications/:id
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/notifications/:id', auth, (req, res) => {
  const notificationId = req.params.id;
  
  res.json({
    id: notificationId,
    read: true,
    updatedAt: new Date().toISOString()
  });
});

module.exports = router;