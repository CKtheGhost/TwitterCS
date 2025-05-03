/**
 * Simplified Quest Routes
 * 
 * Temporary simplified routes for initial setup
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-simple');

/**
 * @route   GET /api/quests
 * @desc    Get all quests
 * @access  Public
 */
router.get('/', (req, res) => {
  const quests = [
    {
      id: '1',
      title: 'Twitter Engagement Quest',
      description: 'Tweet about our platform using the #SocialEngagement hashtag',
      type: 'social',
      difficulty: 'easy',
      rewards: {
        tokens: 100,
        badge: 'Twitter Engager'
      },
      requirements: [
        {
          type: 'twitter_post',
          description: 'Post a tweet with #SocialEngagement'
        }
      ],
      status: 'active',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days from now
    },
    {
      id: '2',
      title: 'Community Participation',
      description: 'Participate in our Discord community',
      type: 'community',
      difficulty: 'medium',
      rewards: {
        tokens: 250,
        badge: 'Community Builder'
      },
      requirements: [
        {
          type: 'discord_verification',
          description: 'Join our Discord server'
        },
        {
          type: 'discord_message',
          description: 'Send at least 5 messages in the community'
        }
      ],
      status: 'active',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString() // 20 days from now
    }
  ];
  
  res.json(quests);
});

/**
 * @route   GET /api/quests/:id
 * @desc    Get quest by ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  const questId = req.params.id;
  
  const quest = {
    id: questId,
    title: questId === '1' ? 'Twitter Engagement Quest' : 'Community Participation',
    description: questId === '1' 
      ? 'Tweet about our platform using the #SocialEngagement hashtag' 
      : 'Participate in our Discord community',
    type: questId === '1' ? 'social' : 'community',
    difficulty: questId === '1' ? 'easy' : 'medium',
    rewards: {
      tokens: questId === '1' ? 100 : 250,
      badge: questId === '1' ? 'Twitter Engager' : 'Community Builder'
    },
    requirements: questId === '1' 
      ? [
          {
            id: 'req1',
            type: 'twitter_post',
            description: 'Post a tweet with #SocialEngagement'
          }
        ] 
      : [
          {
            id: 'req1',
            type: 'discord_verification',
            description: 'Join our Discord server'
          },
          {
            id: 'req2',
            type: 'discord_message',
            description: 'Send at least 5 messages in the community'
          }
        ],
    status: 'active',
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    participants: 42,
    completions: 18
  };
  
  res.json(quest);
});

/**
 * @route   POST /api/quests
 * @desc    Create a new quest
 * @access  Private (Admin only in real implementation)
 */
router.post('/', auth, (req, res) => {
  const { title, description, type, requirements, rewards } = req.body;
  
  if (!title || !description || !type || !requirements || !rewards) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newQuest = {
    id: Date.now().toString(),
    title,
    description,
    type,
    requirements: requirements || [],
    rewards: rewards || { tokens: 0 },
    status: 'draft',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newQuest);
});

/**
 * @route   POST /api/quests/:id/start
 * @desc    Start a quest
 * @access  Private
 */
router.post('/:id/start', auth, (req, res) => {
  const questId = req.params.id;
  
  res.json({
    questId,
    userId: req.user.id,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    message: 'Quest started successfully'
  });
});

/**
 * @route   POST /api/quests/:id/submit
 * @desc    Submit quest completion
 * @access  Private
 */
router.post('/:id/submit', auth, (req, res) => {
  const questId = req.params.id;
  const { evidence } = req.body;
  
  if (!evidence) {
    return res.status(400).json({ error: 'Evidence is required for quest submission' });
  }
  
  res.json({
    questId,
    userId: req.user.id,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    evidence,
    message: 'Quest submission received and will be verified shortly'
  });
});

/**
 * @route   GET /api/quests/user/progress
 * @desc    Get current user's quest progress
 * @access  Private
 */
router.get('/user/progress', auth, (req, res) => {
  res.json([
    {
      questId: '1',
      userId: req.user.id,
      status: 'completed',
      progress: 100,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      rewards: {
        tokens: 100,
        badge: 'Twitter Engager'
      }
    },
    {
      questId: '2',
      userId: req.user.id,
      status: 'in_progress',
      progress: 50,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
      requirements: [
        {
          id: 'req1',
          status: 'completed'
        },
        {
          id: 'req2',
          status: 'in_progress',
          progress: 3,
          total: 5
        }
      ]
    }
  ]);
});

module.exports = router;