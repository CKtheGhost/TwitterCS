/**
 * Simplified Verification Routes
 * 
 * Temporary simplified routes for initial setup
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-simple');

/**
 * @route   GET /api/verify/status
 * @desc    Get current verification status for the user
 * @access  Private
 */
router.get('/status', auth, (req, res) => {
  res.json({
    user: req.user.id,
    twitterVerified: true,
    discordVerified: false,
    emailVerified: true,
    walletVerified: true,
    lastVerified: new Date().toISOString(),
    verificationLevel: 3
  });
});

/**
 * @route   POST /api/verify/twitter
 * @desc    Verify Twitter account
 * @access  Private
 */
router.post('/twitter', auth, (req, res) => {
  const { tweetId } = req.body;

  if (!tweetId) {
    return res.status(400).json({ error: 'Tweet ID is required' });
  }

  res.json({
    success: true,
    user: req.user.id,
    platform: 'twitter',
    message: 'Twitter verification successful',
    status: 'verified',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/verify/discord
 * @desc    Verify Discord account
 * @access  Private
 */
router.post('/discord', auth, (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'OAuth code is required' });
  }

  res.json({
    success: true,
    user: req.user.id,
    platform: 'discord',
    message: 'Discord verification successful',
    status: 'verified',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/verify/wallet
 * @desc    Verify wallet ownership
 * @access  Private
 */
router.post('/wallet', auth, (req, res) => {
  const { address, signature, message } = req.body;

  if (!address || !signature || !message) {
    return res.status(400).json({ error: 'Wallet address, signature, and message are required' });
  }

  res.json({
    success: true,
    user: req.user.id,
    platform: 'wallet',
    message: 'Wallet verification successful',
    address,
    status: 'verified',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/verify/history
 * @desc    Get verification history
 * @access  Private
 */
router.get('/history', auth, (req, res) => {
  res.json([
    {
      platform: 'twitter',
      status: 'verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
    },
    {
      platform: 'wallet',
      status: 'verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
    },
    {
      platform: 'email',
      status: 'verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() // 10 days ago
    }
  ]);
});

module.exports = router;