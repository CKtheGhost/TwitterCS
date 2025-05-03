const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sinon = require('sinon');
const Quest = require('../src/models/Quest');
const QuestCompletion = require('../src/models/QuestCompletion');
const User = require('../src/models/User');
const { quests, questCompletions, users } = require('./fixtures/testData');

let mongoServer;

// Mock console.error to keep tests cleaner
jest.spyOn(console, 'error').mockImplementation(() => {});

// Helper function to create model methods that properly resolve with test data
const createModelMethods = (defaultData = []) => {
  return {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockReturnThis(),
    create: jest.fn().mockImplementation(data => Promise.resolve(data)),
    insertMany: jest.fn().mockResolvedValue([]),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    exists: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    nin: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(defaultData)
  };
};

// Create a mock implementation of timeout for Mongoose queries
mongoose.Query.prototype.timeout = function() {
  return this;
};

// Add a save method to our fixture data objects
const addSaveMethod = (items) => {
  return items.map(item => ({
    ...item,
    save: jest.fn().mockResolvedValue(item)
  }));
};

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Add save method to our fixtures
  const mockQuests = addSaveMethod(quests);
  const mockQuestCompletions = addSaveMethod(questCompletions);
  const mockUsers = addSaveMethod(users);
  
  // Set up model mocks with appropriate defaults from fixtures
  jest.spyOn(Quest, 'find').mockImplementation(() => createModelMethods(mockQuests));
  jest.spyOn(Quest, 'findById').mockImplementation((id) => {
    const quest = mockQuests.find(q => q._id === id);
    return createModelMethods(quest);
  });
  
  jest.spyOn(QuestCompletion, 'find').mockImplementation(() => createModelMethods(mockQuestCompletions));
  jest.spyOn(QuestCompletion, 'findById').mockImplementation((id) => {
    const completion = mockQuestCompletions.find(c => c._id === id);
    return createModelMethods(completion);
  });
  jest.spyOn(QuestCompletion, 'countDocuments').mockResolvedValue(mockQuestCompletions.length);
  
  jest.spyOn(User, 'find').mockImplementation(() => createModelMethods(mockUsers));
  jest.spyOn(User, 'findById').mockImplementation((id) => {
    const user = mockUsers.find(u => u._id === id);
    return createModelMethods(user);
  });
  
  // Create a more flexible model mock that can be overridden in individual tests
  mongoose.model = jest.fn().mockImplementation((modelName) => {
    switch (modelName) {
      case 'Quest':
        return {
          ...createModelMethods(mockQuests),
          // Add specialized methods for Quest
          findActive: jest.fn().mockResolvedValue(mockQuests.filter(q => q.isActive))
        };
      case 'QuestCompletion':
        return {
          ...createModelMethods(mockQuestCompletions),
          // Add specialized methods for QuestCompletion
          getUserCompletionsForQuest: jest.fn().mockImplementation((userId, questId) => {
            return mockQuestCompletions.filter(c => c.user === userId && c.quest === questId);
          })
        };
      case 'User':
        return {
          ...createModelMethods(mockUsers),
          // Add specialized methods for User
          findByEmail: jest.fn().mockImplementation((email) => {
            return mockUsers.find(u => u.email === email);
          })
        };
      default:
        return createModelMethods([]);
    }
  });
  
  // Seed data into the in-memory database
  try {
    await Quest.insertMany(quests);
    await QuestCompletion.insertMany(questCompletions);
    await User.insertMany(users);
  } catch (error) {
    console.error('Failed to seed test database:', error);
  }
});

// Set up mock for objectId conversion
mongoose.Types = {
  ...mongoose.Types,
  ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id')
};

// Add prototype method mocks for all documents
mongoose.Document.prototype.save = jest.fn().mockResolvedValue(this);

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  sinon.restore();
  
  // Clear all collections 
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Cleanup after all tests are done
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// Mock the environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRATION = '1h';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.PORT = '5001';

// Mock other services
jest.mock('../src/services/botDetectionService', () => ({
  shouldThrottleUser: jest.fn().mockResolvedValue(false),
  recordActivity: jest.fn().mockResolvedValue({}),
  isLikelyBot: jest.fn().mockResolvedValue(false)
}));

jest.mock('../src/services/consentService', () => ({
  hasUserConsented: jest.fn().mockResolvedValue(true),
  getUserConsentStatus: jest.fn().mockResolvedValue({ 
    dataUsage: { 
      publicProfile: true,
      analytics: true 
    } 
  }),
  recordConsent: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/services/ethicalDataService', () => ({
  verifyQuestCompletion: jest.fn().mockResolvedValue({
    verified: true,
    verificationData: {
      type: 'api',
      timestamp: new Date()
    }
  }),
  trackUserBehavior: jest.fn().mockResolvedValue({}),
  shouldAllowAccess: jest.fn().mockResolvedValue(true)
}));

// Export fixtures for tests that need direct access
module.exports = {
  getFixtures: () => ({
    quests,
    questCompletions,
    users
  })
};