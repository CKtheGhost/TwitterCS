/**
 * Test fixtures for end-to-end and integration tests.
 * This file contains shared test data to be used across tests.
 */

// Mock quests
const quests = [
  {
    _id: 'quest1',
    title: 'Post about our platform',
    description: 'Create a public post mentioning our platform with the hashtag #SocialEngagement',
    type: 'post',
    platform: 'twitter',
    action: 'post',
    points: 10,
    dailyLimit: 1,
    season: 1,
    isActive: true,
    requirements: {
      contentMatch: '#SocialEngagement',
      minCharacters: 20
    },
    validationRules: {
      autoValidate: true,
      requiresProof: false
    },
    createdBy: 'admin1',
    createdAt: new Date('2023-01-01T12:00:00.000Z'),
    updatedAt: new Date('2023-01-01T12:00:00.000Z')
  },
  {
    _id: 'quest2',
    title: 'Like an official post',
    description: 'Like one of our official posts to earn points',
    type: 'like',
    platform: 'twitter',
    action: 'like',
    points: 5,
    dailyLimit: 3,
    season: 1,
    isActive: true,
    requirements: {
      contentId: '123456789'
    },
    validationRules: {
      autoValidate: true,
      requiresProof: false
    },
    createdBy: 'admin1',
    createdAt: new Date('2023-01-02T12:00:00.000Z'),
    updatedAt: new Date('2023-01-02T12:00:00.000Z')
  },
  {
    _id: 'quest3',
    title: 'Share educational content',
    description: 'Share one of our educational posts about blockchain',
    type: 'share',
    platform: 'twitter',
    action: 'retweet',
    points: 15,
    dailyLimit: 1,
    season: 1,
    isActive: true,
    requirements: {
      contentId: '987654321'
    },
    validationRules: {
      autoValidate: false,
      requiresProof: true
    },
    createdBy: 'admin1',
    createdAt: new Date('2023-01-03T12:00:00.000Z'),
    updatedAt: new Date('2023-01-03T12:00:00.000Z')
  },
  {
    _id: 'inactiveQuest',
    title: 'Inactive Quest',
    description: 'This quest is no longer active',
    type: 'post',
    platform: 'twitter',
    action: 'post',
    points: 20,
    dailyLimit: 1,
    season: 1,
    isActive: false,
    requirements: {
      contentMatch: '#Inactive'
    },
    validationRules: {
      autoValidate: true,
      requiresProof: false
    },
    createdBy: 'admin1',
    createdAt: new Date('2023-01-04T12:00:00.000Z'),
    updatedAt: new Date('2023-01-05T12:00:00.000Z')
  }
];

// Mock quest completions
const questCompletions = [
  {
    _id: 'completion1',
    user: 'user1',
    quest: 'quest1',
    season: 1,
    pointsEarned: 10,
    status: 'approved',
    verificationData: {
      completedAt: new Date('2023-01-10T14:30:00.000Z'),
      platform: 'twitter',
      contentId: '1111111111',
      content: 'Check out this awesome #SocialEngagement platform!'
    },
    createdAt: new Date('2023-01-10T14:30:00.000Z')
  },
  {
    _id: 'completion2',
    user: 'user1',
    quest: 'quest2',
    season: 1,
    pointsEarned: 5,
    status: 'approved',
    verificationData: {
      completedAt: new Date('2023-01-10T15:45:00.000Z'),
      platform: 'twitter',
      contentId: '123456789'
    },
    createdAt: new Date('2023-01-10T15:45:00.000Z')
  },
  {
    _id: 'reviewCompletion',
    user: 'user2',
    quest: 'quest3',
    season: 1,
    pointsEarned: 0,
    status: 'pending_review',
    verificationData: {
      completedAt: new Date('2023-01-11T10:15:00.000Z'),
      platform: 'twitter',
      contentId: '2222222222',
      proof: 'https://twitter.com/user2/status/2222222222'
    },
    createdAt: new Date('2023-01-11T10:15:00.000Z')
  }
];

// Mock users
const users = [
  {
    _id: 'user1',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    accountStatus: 'active',
    verification: {
      email: { verified: true },
      twitter: { verified: true, handle: '@testuser' }
    },
    walletAddress: '0xabc123',
    stats: {
      totalPoints: 15,
      completedQuests: 2,
      currentStreak: 1,
      longestStreak: 1
    }
  },
  {
    _id: 'user2',
    name: 'Another User',
    email: 'another@example.com',
    role: 'user',
    accountStatus: 'active',
    verification: {
      email: { verified: true },
      twitter: { verified: true, handle: '@anotheruser' }
    },
    walletAddress: '0xdef456',
    stats: {
      totalPoints: 0,
      completedQuests: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  },
  {
    _id: 'admin1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    accountStatus: 'active',
    verification: {
      email: { verified: true },
      twitter: { verified: true, handle: '@adminuser' }
    },
    walletAddress: '0x789ghi',
    stats: {
      totalPoints: 0,
      completedQuests: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  },
  {
    _id: 'unverified1',
    name: 'Unverified User',
    email: 'unverified@example.com',
    role: 'user',
    accountStatus: 'active',
    verification: {
      email: { verified: true },
      twitter: { verified: false }
    },
    walletAddress: '0xjkl012'
  }
];

// Mock tokens for testing
const tokens = {
  adminToken: 'admin-jwt-token',
  userToken: 'user-jwt-token',
  user2Token: 'user2-jwt-token',
  unverifiedToken: 'unverified-jwt-token',
  invalidToken: 'invalid-jwt-token'
};

// Mock quest submission data
const questSubmissions = {
  validPost: {
    content: 'Testing the #SocialEngagement platform with a valid post!',
    proof: 'https://twitter.com/testuser/status/12345'
  },
  invalidPost: {
    content: 'Invalid post without proper hashtag',
    proof: 'https://twitter.com/testuser/status/67890'
  },
  validLike: {
    contentId: '123456789'
  },
  validRetweet: {
    contentId: '987654321',
    proof: 'https://twitter.com/testuser/status/45678'
  }
};

// Mock quest creation data
const newQuestData = {
  valid: {
    title: 'New Test Quest',
    description: 'A new quest for testing purposes',
    type: 'post',
    platform: 'twitter',
    action: 'post',
    points: 25,
    dailyLimit: 1,
    season: 1,
    requirements: {
      contentMatch: '#NewQuest',
      minCharacters: 30
    },
    validationRules: {
      autoValidate: true,
      requiresProof: false
    }
  },
  invalid: {
    // Missing required title
    description: 'Invalid quest without a title',
    platform: 'twitter'
  }
};

module.exports = {
  quests,
  questCompletions,
  users,
  tokens,
  questSubmissions,
  newQuestData
};