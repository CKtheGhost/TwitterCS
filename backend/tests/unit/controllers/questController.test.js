const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const questController = require('../../../src/controllers/questController');
const questService = require('../../../src/services/questService');
const botDetectionService = require('../../../src/services/botDetectionService');
const Quest = require('../../../src/models/Quest');
const QuestCompletion = require('../../../src/models/QuestCompletion');
const { APIError } = require('../../../src/utils/errorHandler');

// Mock data
const mockQuests = [
  {
    _id: 'quest1',
    title: 'Test Quest 1',
    description: 'Test Description 1',
    type: 'post',
    platform: 'twitter',
    action: 'post',
    points: 10,
    dailyLimit: 1,
    season: 1,
    isActive: true,
    createdBy: 'user1'
  },
  {
    _id: 'quest2',
    title: 'Test Quest 2',
    description: 'Test Description 2',
    type: 'like',
    platform: 'twitter',
    action: 'like',
    points: 5,
    dailyLimit: 2,
    season: 1,
    isActive: true,
    createdBy: 'user1'
  }
];

const mockQuestCompletions = [
  {
    _id: 'completion1',
    user: 'user1',
    quest: 'quest1',
    season: 1,
    pointsEarned: 10,
    status: 'approved',
    verificationData: {
      completedAt: new Date(),
      platform: 'twitter'
    }
  }
];

describe('Quest Controller', () => {
  let sandbox;
  let req, res, next;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Reset the req, res, next objects before each test
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user1', role: 'user' }
    };
    
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub()
    };
    
    next = sandbox.stub();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('getQuests', () => {
    it('should get all active quests successfully', async () => {
      // Arrange
      const findStub = sandbox.stub(Quest, 'find').returns({
        sort: sandbox.stub().returns({
          select: sandbox.stub().resolves(mockQuests)
        })
      });
      
      // Act
      await questController.getQuests(req, res, next);
      
      // Assert
      expect(findStub.calledOnce).to.be.true;
      expect(findStub.firstCall.args[0]).to.deep.equal({ isActive: true });
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(mockQuests.length);
      expect(responseBody.data).to.deep.equal(mockQuests);
    });
    
    it('should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Database error';
      const findStub = sandbox.stub(Quest, 'find').returns({
        sort: sandbox.stub().returns({
          select: sandbox.stub().rejects(new Error(errorMessage))
        })
      });
      
      // Act
      await questController.getQuests(req, res, next);
      
      // Assert
      expect(findStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal(errorMessage);
    });
  });
  
  describe('getQuest', () => {
    it('should get a single quest by ID successfully', async () => {
      // Arrange
      const questId = 'quest1';
      req.params.id = questId;
      
      const findByIdStub = sandbox.stub(Quest, 'findById').returns({
        select: sandbox.stub().resolves(mockQuests[0])
      });
      
      // Act
      await questController.getQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(questId)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.data).to.deep.equal(mockQuests[0]);
    });
    
    it('should return 404 when quest is not found', async () => {
      // Arrange
      const questId = 'nonexistentQuest';
      req.params.id = questId;
      
      const findByIdStub = sandbox.stub(Quest, 'findById').returns({
        select: sandbox.stub().resolves(null)
      });
      
      // Act
      await questController.getQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(questId)).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(404);
      expect(error.message).to.include('Quest not found');
      expect(error.errors[0].code).to.equal('not_found');
    });
  });
  
  describe('createQuest', () => {
    it('should create a new quest when user is admin', async () => {
      // Arrange
      req.user.role = 'admin';
      const questData = {
        title: 'New Quest',
        description: 'New Description',
        type: 'post',
        platform: 'twitter',
        action: 'post',
        points: 15,
        dailyLimit: 1
      };
      req.body = questData;
      
      const createdQuest = { ...questData, _id: 'newQuest', createdBy: req.user.id };
      const createQuestStub = sandbox.stub(questService, 'createQuest').resolves(createdQuest);
      
      // Act
      await questController.createQuest(req, res, next);
      
      // Assert
      expect(createQuestStub.calledOnce).to.be.true;
      expect(createQuestStub.calledWith(questData, req.user.id)).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.data).to.deep.equal(createdQuest);
    });
    
    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user.role = 'user';
      
      // Act
      await questController.createQuest(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('Not authorized');
      expect(error.errors[0].code).to.equal('insufficient_permissions');
    });
    
    it('should handle validation errors from the service', async () => {
      // Arrange
      req.user.role = 'admin';
      const invalidQuestData = { 
        // Missing required fields
        type: 'post',
        platform: 'twitter' 
      };
      req.body = invalidQuestData;
      
      const validationError = new Error('Quest validation failed: title is required');
      validationError.message = 'validation';
      const createQuestStub = sandbox.stub(questService, 'createQuest').rejects(validationError);
      
      // Act
      await questController.createQuest(req, res, next);
      
      // Assert
      expect(createQuestStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Quest validation failed');
      expect(error.errors[0].code).to.equal('invalid_input');
    });
  });
  
  describe('updateQuest', () => {
    it('should update a quest when user is admin', async () => {
      // Arrange
      req.user.role = 'admin';
      req.params.id = 'quest1';
      const updateData = { title: 'Updated Title' };
      req.body = updateData;
      
      const findByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuests[0]);
      const updatedQuest = { ...mockQuests[0], title: 'Updated Title' };
      const findByIdAndUpdateStub = sandbox.stub(Quest, 'findByIdAndUpdate').resolves(updatedQuest);
      
      // Act
      await questController.updateQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(req.params.id)).to.be.true;
      expect(findByIdAndUpdateStub.calledOnce).to.be.true;
      expect(findByIdAndUpdateStub.calledWith(req.params.id, updateData, {
        new: true,
        runValidators: true
      })).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.data).to.deep.equal(updatedQuest);
    });
    
    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user.role = 'user';
      req.params.id = 'quest1';
      
      // Act
      await questController.updateQuest(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('Not authorized');
      expect(error.errors[0].code).to.equal('insufficient_permissions');
    });
    
    it('should return 404 if quest does not exist', async () => {
      // Arrange
      req.user.role = 'admin';
      req.params.id = 'nonexistentQuest';
      
      const findByIdStub = sandbox.stub(Quest, 'findById').resolves(null);
      
      // Act
      await questController.updateQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(req.params.id)).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(404);
      expect(error.message).to.include('Quest not found');
      expect(error.errors[0].code).to.equal('not_found');
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      req.user.role = 'admin';
      req.params.id = 'quest1';
      const invalidUpdateData = { points: -5 }; // Invalid points value
      req.body = invalidUpdateData;
      
      const findByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuests[0]);
      
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        points: {
          path: 'points',
          message: 'Points must be at least 1'
        }
      };
      
      const findByIdAndUpdateStub = sandbox.stub(Quest, 'findByIdAndUpdate').rejects(validationError);
      
      // Act
      await questController.updateQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(req.params.id)).to.be.true;
      expect(findByIdAndUpdateStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Validation failed');
      expect(error.errors[0].field).to.equal('points');
      expect(error.errors[0].code).to.equal('validation_error');
    });
  });
  
  describe('deleteQuest', () => {
    it('should deactivate a quest when user is admin', async () => {
      // Arrange
      req.user.role = 'admin';
      req.params.id = 'quest1';
      
      const mockQuest = { 
        ...mockQuests[0], 
        save: sandbox.stub().resolves()
      };
      
      const findByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      
      // Act
      await questController.deleteQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(req.params.id)).to.be.true;
      expect(mockQuest.isActive).to.be.false;
      expect(mockQuest.save.calledOnce).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.message).to.include('deactivated');
    });
    
    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user.role = 'user';
      req.params.id = 'quest1';
      
      // Act
      await questController.deleteQuest(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('Not authorized');
      expect(error.errors[0].code).to.equal('insufficient_permissions');
    });
    
    it('should return 404 if quest does not exist', async () => {
      // Arrange
      req.user.role = 'admin';
      req.params.id = 'nonexistentQuest';
      
      const findByIdStub = sandbox.stub(Quest, 'findById').resolves(null);
      
      // Act
      await questController.deleteQuest(req, res, next);
      
      // Assert
      expect(findByIdStub.calledWith(req.params.id)).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(404);
      expect(error.message).to.include('Quest not found');
      expect(error.errors[0].code).to.equal('not_found');
    });
  });
  
  describe('getAvailableQuests', () => {
    it('should get available quests for the current user', async () => {
      // Arrange
      req.user.id = 'user1';
      req.query.season = '1';
      
      const availableQuests = [
        { ...mockQuests[0], completedToday: 0, remainingToday: 1, isCompletedToday: false },
        { ...mockQuests[1], completedToday: 0, remainingToday: 2, isCompletedToday: false }
      ];
      
      const getAvailableQuestsStub = sandbox.stub(questService, 'getAvailableQuests').resolves(availableQuests);
      
      // Act
      await questController.getAvailableQuests(req, res, next);
      
      // Assert
      expect(getAvailableQuestsStub.calledOnce).to.be.true;
      expect(getAvailableQuestsStub.calledWith(req.user.id, 1)).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(availableQuests.length);
      expect(responseBody.data).to.deep.equal(availableQuests);
    });
    
    it('should handle invalid season parameter', async () => {
      // Arrange
      req.query.season = 'invalid';
      
      // Act
      await questController.getAvailableQuests(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid season value');
      expect(error.errors[0].code).to.equal('invalid_parameter');
    });
    
    it('should handle service errors', async () => {
      // Arrange
      req.user.id = 'user1';
      
      const serviceError = new Error('Database timeout');
      const getAvailableQuestsStub = sandbox.stub(questService, 'getAvailableQuests').rejects(serviceError);
      
      // Act
      await questController.getAvailableQuests(req, res, next);
      
      // Assert
      expect(getAvailableQuestsStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Failed to retrieve available quests');
      expect(error.errors[0].code).to.equal('service_unavailable');
    });
  });
  
  describe('completeQuest', () => {
    it('should complete a quest successfully', async () => {
      // Arrange
      req.user.id = 'user1';
      req.params.id = 'quest1';
      req.body = { content: 'Test content', proof: 'Test proof' };
      req.ip = '127.0.0.1';
      req.headers = { 'user-agent': 'test-agent' };
      
      const shouldThrottleStub = sandbox.stub(botDetectionService, 'shouldThrottleUser').resolves(false);
      
      const completionResult = {
        success: true,
        pointsEarned: 10,
        requiresReview: false,
        completion: { _id: 'completion1' }
      };
      
      const validateQuestCompletionStub = sandbox.stub(questService, 'validateQuestCompletion').resolves(completionResult);
      
      // Act
      await questController.completeQuest(req, res, next);
      
      // Assert
      expect(shouldThrottleStub.calledWith(req.user.id)).to.be.true;
      expect(validateQuestCompletionStub.calledOnce).to.be.true;
      
      const proofData = {
        content: 'Test content',
        proof: 'Test proof',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };
      
      expect(validateQuestCompletionStub.calledWith(req.params.id, req.user.id, proofData)).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.data.pointsEarned).to.equal(completionResult.pointsEarned);
      expect(responseBody.data.requiresReview).to.equal(completionResult.requiresReview);
      expect(responseBody.data.completionId).to.equal(completionResult.completion._id);
    });
    
    it('should handle throttling from bot detection', async () => {
      // Arrange
      req.user.id = 'user1';
      req.params.id = 'quest1';
      req.ip = '127.0.0.1';
      req.headers = { 'user-agent': 'test-agent' };
      
      const shouldThrottleStub = sandbox.stub(botDetectionService, 'shouldThrottleUser').resolves(true);
      
      // Act
      await questController.completeQuest(req, res, next);
      
      // Assert
      expect(shouldThrottleStub.calledWith(req.user.id)).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(429);
      expect(error.message).to.include('Too many requests');
      expect(error.errors[0].code).to.equal('too_many_requests');
      expect(error.errors[0].retryAfter).to.equal('300');
    });
    
    it('should handle validation failure from service', async () => {
      // Arrange
      req.user.id = 'user1';
      req.params.id = 'quest1';
      req.ip = '127.0.0.1';
      req.headers = { 'user-agent': 'test-agent' };
      
      const shouldThrottleStub = sandbox.stub(botDetectionService, 'shouldThrottleUser').resolves(false);
      
      const validationResult = {
        success: false,
        code: 'DAILY_LIMIT_REACHED',
        message: 'Daily quest limit reached'
      };
      
      const validateQuestCompletionStub = sandbox.stub(questService, 'validateQuestCompletion').resolves(validationResult);
      
      // Act
      await questController.completeQuest(req, res, next);
      
      // Assert
      expect(shouldThrottleStub.calledWith(req.user.id)).to.be.true;
      expect(validateQuestCompletionStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.errors[0].code).to.equal('daily_limit_reached');
      expect(error.errors[0].type).to.equal('limit');
    });
  });
  
  describe('getQuestCompletions', () => {
    it('should get user quest completions with pagination', async () => {
      // Arrange
      req.user.id = 'user1';
      req.query.page = '1';
      req.query.limit = '10';
      
      const countDocumentsStub = sandbox.stub(QuestCompletion, 'countDocuments').resolves(1);
      
      const findStub = sandbox.stub(QuestCompletion, 'find').returns({
        sort: sandbox.stub().returns({
          populate: sandbox.stub().returns({
            select: sandbox.stub().returns({
              skip: sandbox.stub().returns({
                limit: sandbox.stub().resolves(mockQuestCompletions)
              })
            })
          })
        })
      });
      
      // Act
      await questController.getQuestCompletions(req, res, next);
      
      // Assert
      expect(countDocumentsStub.calledWith({ user: req.user.id })).to.be.true;
      expect(findStub.calledWith({ user: req.user.id })).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(mockQuestCompletions.length);
      expect(responseBody.data).to.deep.equal(mockQuestCompletions);
      
      // Check pagination info
      expect(responseBody.pagination).to.be.an('object');
      expect(responseBody.pagination.total).to.equal(1);
      expect(responseBody.pagination.page).to.equal(1);
      expect(responseBody.pagination.limit).to.equal(10);
      expect(responseBody.pagination.pages).to.equal(1);
    });
    
    it('should handle invalid pagination parameters', async () => {
      // Arrange
      req.user.id = 'user1';
      req.query.page = '0';  // Invalid page number
      req.query.limit = '10';
      
      // Act
      await questController.getQuestCompletions(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid pagination parameters');
      expect(error.errors[0].code).to.equal('invalid_parameters');
    });
    
    it('should handle service errors', async () => {
      // Arrange
      req.user.id = 'user1';
      req.query.page = '1';
      req.query.limit = '10';
      
      const dbError = new Error('Database connection error');
      const countDocumentsStub = sandbox.stub(QuestCompletion, 'countDocuments').rejects(dbError);
      
      // Act
      await questController.getQuestCompletions(req, res, next);
      
      // Assert
      expect(countDocumentsStub.calledWith({ user: req.user.id })).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Failed to retrieve quest completions');
      expect(error.errors[0].code).to.equal('database_error');
    });
  });
  
  describe('getQuestStats', () => {
    it('should get user quest statistics', async () => {
      // Arrange
      req.user.id = 'user1';
      req.query.season = '1';
      
      const mockStats = {
        totalPoints: 100,
        completedQuests: 10,
        currentStreak: 3,
        longestStreak: 5
      };
      
      const getUserQuestStatsStub = sandbox.stub(questService, 'getUserQuestStats').resolves(mockStats);
      
      // Act
      await questController.getQuestStats(req, res, next);
      
      // Assert
      expect(getUserQuestStatsStub.calledOnce).to.be.true;
      expect(getUserQuestStatsStub.calledWith(req.user.id, 1)).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.data).to.deep.equal(mockStats);
    });
    
    it('should handle invalid season parameter', async () => {
      // Arrange
      req.query.season = '-1';  // Invalid season
      
      // Act
      await questController.getQuestStats(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid season parameter');
      expect(error.errors[0].code).to.equal('invalid_parameter');
    });
    
    it('should handle service errors', async () => {
      // Arrange
      req.user.id = 'user1';
      
      const serviceError = new Error('Failed to calculate stats');
      const getUserQuestStatsStub = sandbox.stub(questService, 'getUserQuestStats').rejects(serviceError);
      
      // Act
      await questController.getQuestStats(req, res, next);
      
      // Assert
      expect(getUserQuestStatsStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Failed to retrieve quest statistics');
      expect(error.errors[0].code).to.equal('stats_retrieval_failed');
    });
  });
});