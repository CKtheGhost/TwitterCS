const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const questVerificationController = require('../../../src/controllers/questVerificationController');
const ethicalDataService = require('../../../src/services/ethicalDataService');
const consentService = require('../../../src/services/consentService');
const User = require('../../../src/models/User');
const Quest = require('../../../src/models/Quest');
const QuestCompletion = require('../../../src/models/QuestCompletion');
const { APIError } = require('../../../src/utils/errorHandler');

// Mock data
const mockQuest = {
  _id: 'quest123',
  title: 'Test Twitter Quest',
  description: 'Test quest for Twitter',
  type: 'post',
  platform: 'twitter',
  action: 'post',
  points: 10,
  dailyLimit: 1,
  isActive: true,
  season: 1,
  requirements: {
    contentMatch: '#test',
    minCharacters: 10
  },
  rewards: {
    tokenAmount: 10,
    xpPoints: 5
  },
  toObject: function() {
    return {
      _id: this._id,
      title: this.title,
      description: this.description,
      type: this.type,
      platform: this.platform,
      action: this.action,
      points: this.points,
      dailyLimit: this.dailyLimit,
      isActive: this.isActive,
      season: this.season,
      requirements: this.requirements,
      rewards: this.rewards
    };
  }
};

const mockUser = {
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  verification: {
    twitter: {
      username: 'testuser_twitter',
      verified: true,
      verifiedAt: new Date()
    }
  },
  completedQuests: [],
  accountStatus: 'active'
};

describe('Quest Verification Controller', () => {
  let sandbox;
  let req, res, next;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Reset the req, res, next objects before each test
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123' },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-user-agent'
      }
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
  
  describe('verifyQuestCompletion', () => {
    it('should successfully verify a quest completion', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: {
          tweetId: '12345',
          tweetContent: '#test content'
        }
      };
      
      // Stubs for external dependencies
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const verificationResult = {
        verified: true,
        verificationData: {
          type: 'api',
          timestamp: new Date(),
          success: true
        }
      };
      
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').resolves(verificationResult);
      
      const saveCompletionStub = sandbox.stub(QuestCompletion.prototype, 'save').resolves();
      const updateUserStub = sandbox.stub(User, 'findByIdAndUpdate').resolves(mockUser);
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(hasUserConsentedStub.calledWith(req.user.id, 'dataUsage.publicProfile')).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(saveCompletionStub.calledOnce).to.be.true;
      expect(updateUserStub.calledOnce).to.be.true;
      
      // Check response
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.message).to.include('verified');
      expect(responseBody.rewards).to.deep.equal(mockQuest.rewards);
    });
    
    it('should return 400 when questId is missing', async () => {
      // Arrange
      req.body = {
        platformData: { tweetId: '12345' }
      };
      
      // Mock the throwError function to properly handle errors
      const errorHandlerModule = require('../../../src/utils/errorHandler');
      const throwErrorStub = sandbox.stub(errorHandlerModule, 'throwError').throws(
        new errorHandlerModule.APIError('Quest ID is required', 400, [{
          type: 'validation',
          code: 'missing_field',
          field: 'questId',
          message: 'The quest ID field is required for verification'
        }])
      );
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res, next);
      
      // Assert
      expect(throwErrorStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Quest ID is required');
      expect(error.errors[0].code).to.equal('missing_field');
    });
    
    it('should return 404 when quest is not found', async () => {
      // Arrange
      req.body = {
        questId: 'nonexistent',
        platformData: { tweetId: '12345' }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(null);
      
      // Mock the throwError function to properly handle errors
      const errorHandlerModule = require('../../../src/utils/errorHandler');
      const throwErrorStub = sandbox.stub(errorHandlerModule, 'throwError').throws(
        new errorHandlerModule.APIError('Quest not found', 404, [{
          type: 'resource',
          code: 'quest_not_found',
          message: `Quest with ID ${req.body.questId} does not exist`
        }])
      );
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res, next);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(throwErrorStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(404);
      expect(error.message).to.include('Quest not found');
      expect(error.errors[0].code).to.equal('quest_not_found');
    });
    
    it('should return 403 when user has not consented', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(false);
      
      // Mock the throwError function to properly handle errors
      const errorHandlerModule = require('../../../src/utils/errorHandler');
      const throwErrorStub = sandbox.stub(errorHandlerModule, 'throwError').throws(
        new errorHandlerModule.APIError('Consent required for quest verification', 403, [{
          type: 'consent',
          code: 'consent_required',
          consentType: 'dataUsage.publicProfile',
          message: 'This quest requires verification of your twitter post actions',
          details: {
            needsConsent: true,
            consentType: 'dataUsage.publicProfile',
            consentReason: 'This quest requires verification of your twitter post actions.'
          }
        }])
      );
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res, next);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(throwErrorStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.include('Consent required');
      expect(error.errors[0].code).to.equal('consent_required');
    });
    
    it('should return 400 when Twitter account is not verified', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      const unverifiedUser = {
        ...mockUser,
        verification: {
          twitter: {
            username: 'testuser_twitter',
            verified: false
          }
        }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(unverifiedUser);
      
      // Mock the throwError function to properly handle errors
      const errorHandlerModule = require('../../../src/utils/errorHandler');
      const throwErrorStub = sandbox.stub(errorHandlerModule, 'throwError').throws(
        new errorHandlerModule.APIError('Twitter account verification required', 400, [{
          type: 'verification',
          code: 'account_verification_required',
          platform: 'twitter',
          message: 'You must first verify your Twitter account to complete this quest',
          details: {
            verificationRequired: true,
            platform: 'twitter'
          }
        }])
      );
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res, next);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(throwErrorStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Twitter account verification required');
      expect(error.errors[0].code).to.equal('account_verification_required');
    });
    
    it('should handle API rate limiting errors during verification', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const rateLimitError = new Error('API rate limit exceeded');
      rateLimitError.message = 'rate limit exceeded';
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').rejects(rateLimitError);
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(429);
      expect(error.message).to.include('API rate limit exceeded');
      expect(error.errors[0].code).to.equal('api_rate_limit');
      expect(error.errors[0].retryAfter).to.equal('60');
    });
    
    it('should handle network errors during verification', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const networkError = new Error('Network timeout');
      networkError.message = 'network timeout';
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').rejects(networkError);
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(503);
      expect(error.message).to.include('Network error');
      expect(error.errors[0].code).to.equal('network_error');
      expect(error.errors[0].retryable).to.be.true;
    });
    
    it('should return 400 when verification fails', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const verificationResult = {
        verified: false,
        verificationData: {
          type: 'api',
          timestamp: new Date(),
          reason: 'Content does not match requirements'
        }
      };
      
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').resolves(verificationResult);
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Quest completion could not be verified');
      expect(error.errors[0].code).to.equal('verification_failed');
      expect(error.errors[0].suggestions).to.be.an('array');
    });
    
    it('should handle errors when saving completion record', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      // Stubs for external dependencies
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const verificationResult = {
        verified: true,
        verificationData: {
          type: 'api',
          timestamp: new Date(),
          success: true
        }
      };
      
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').resolves(verificationResult);
      
      const saveError = new Error('Database error');
      const saveCompletionStub = sandbox.stub(QuestCompletion.prototype, 'save').rejects(saveError);
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(saveCompletionStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Failed to save quest completion');
      expect(error.errors[0].code).to.equal('completion_save_error');
    });
    
    it('should complete verification even if user update fails', async () => {
      // Arrange
      req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      // Stubs for external dependencies
      const findQuestByIdStub = sandbox.stub(Quest, 'findById').resolves(mockQuest);
      const hasUserConsentedStub = sandbox.stub(consentService, 'hasUserConsented').resolves(true);
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const verificationResult = {
        verified: true,
        verificationData: {
          type: 'api',
          timestamp: new Date(),
          success: true
        }
      };
      
      const verifyQuestCompletionStub = sandbox.stub(ethicalDataService, 'verifyQuestCompletion').resolves(verificationResult);
      
      const saveCompletionStub = sandbox.stub(QuestCompletion.prototype, 'save').resolves();
      
      // Make the user update fail
      const updateError = new Error('Database error');
      const updateUserStub = sandbox.stub(User, 'findByIdAndUpdate').rejects(updateError);
      
      // Add console.error stub to verify it's called
      const consoleErrorStub = sandbox.stub(console, 'error');
      
      // Act
      await questVerificationController.verifyQuestCompletion(req, res);
      
      // Assert
      expect(findQuestByIdStub.calledWith(req.body.questId)).to.be.true;
      expect(hasUserConsentedStub.calledOnce).to.be.true;
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(verifyQuestCompletionStub.calledOnce).to.be.true;
      expect(saveCompletionStub.calledOnce).to.be.true;
      expect(updateUserStub.calledOnce).to.be.true;
      expect(consoleErrorStub.calledOnce).to.be.true;
      
      // The request should still succeed
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.message).to.include('verified');
    });
  });
  
  describe('getQuestCompletions', () => {
    it('should get user quest completions with pagination', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.page = '1';
      req.query.limit = '10';
      
      const mockCompletions = [
        {
          _id: 'completion1',
          quest: {
            _id: 'quest1',
            title: 'Quest 1',
            description: 'Description 1',
            platform: 'twitter',
            action: 'post'
          },
          rewards: { tokenAmount: 10, xpPoints: 5 },
          verificationData: { completedAt: new Date() }
        }
      ];
      
      const countDocumentsStub = sandbox.stub(QuestCompletion, 'countDocuments').resolves(1);
      
      const findStub = sandbox.stub(QuestCompletion, 'find').returns({
        select: sandbox.stub().returns({
          populate: sandbox.stub().returns({
            sort: sandbox.stub().returns({
              skip: sandbox.stub().returns({
                limit: sandbox.stub().resolves(mockCompletions)
              })
            })
          })
        })
      });
      
      // Act
      await questVerificationController.getQuestCompletions(req, res);
      
      // Assert
      expect(countDocumentsStub.calledOnce).to.be.true;
      expect(findStub.calledOnce).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(mockCompletions.length);
      expect(responseBody.data).to.deep.equal(mockCompletions);
      
      // Check pagination
      expect(responseBody.pagination).to.be.an('object');
      expect(responseBody.pagination.total).to.equal(1);
      expect(responseBody.pagination.page).to.equal(1);
      expect(responseBody.pagination.limit).to.equal(10);
      expect(responseBody.pagination.pages).to.equal(1);
    });
    
    it('should handle invalid pagination parameters', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.page = '0';  // Invalid
      req.query.limit = '10';
      
      // Act
      await questVerificationController.getQuestCompletions(req, res);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid pagination parameters');
      expect(error.errors[0].code).to.equal('invalid_parameters');
    });
    
    it('should handle database errors', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.page = '1';
      req.query.limit = '10';
      
      const dbError = new Error('Database connection error');
      const countDocumentsStub = sandbox.stub(QuestCompletion, 'countDocuments').rejects(dbError);
      
      // Act
      await questVerificationController.getQuestCompletions(req, res);
      
      // Assert
      expect(countDocumentsStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Failed to retrieve quest completion history');
      expect(error.errors[0].code).to.equal('retrieval_error');
    });
    
    it('should handle CastError validation errors', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.page = '1';
      req.query.limit = '10';
      
      const castError = new Error('Cast error');
      castError.name = 'CastError';
      castError.path = 'questId';
      castError.value = 'invalid-id';
      
      const countDocumentsStub = sandbox.stub(QuestCompletion, 'countDocuments').rejects(castError);
      
      // Act
      await questVerificationController.getQuestCompletions(req, res);
      
      // Assert
      expect(countDocumentsStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid query parameter');
      expect(error.errors[0].code).to.equal('invalid_parameter');
      expect(error.errors[0].field).to.equal('questId');
    });
  });
  
  describe('getAvailableQuests', () => {
    it('should get available quests for the user', async () => {
      // Arrange
      req.user.id = 'user123';
      
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const mockQuests = [
        mockQuest,
        {
          _id: 'quest456',
          title: 'Test Twitter Like Quest',
          description: 'Test like quest for Twitter',
          type: 'like',
          platform: 'twitter',
          action: 'like',
          points: 5,
          dailyLimit: 2,
          isActive: true,
          season: 1,
          toObject: function() {
            return {
              _id: this._id,
              title: this.title,
              description: this.description,
              type: this.type,
              platform: this.platform,
              action: this.action,
              points: this.points,
              dailyLimit: this.dailyLimit,
              isActive: this.isActive,
              season: this.season
            };
          }
        }
      ];
      
      const findQuestsStub = sandbox.stub(Quest, 'find').resolves(mockQuests);
      
      const userConsents = [
        { type: 'dataUsage.publicProfile', status: 'granted' },
        { type: 'dataUsage.engagementMetrics', status: 'granted' }
      ];
      
      const getUserConsentStatusStub = sandbox.stub(consentService, 'getUserConsentStatus').resolves(userConsents);
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(findQuestsStub.calledOnce).to.be.true;
      expect(getUserConsentStatusStub.calledWith(req.user.id)).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(mockQuests.length);
      expect(responseBody.data).to.be.an('array').with.lengthOf(mockQuests.length);
      
      // Check that each quest has privacy and eligibility info
      responseBody.data.forEach(quest => {
        expect(quest).to.have.property('privacyRequirements');
        expect(quest).to.have.property('userEligibility');
        expect(quest.userEligibility.hasRequiredVerification).to.be.true;
        expect(quest.userEligibility.hasRequiredConsents).to.be.true;
        expect(quest.userEligibility.isReady).to.be.true;
      });
      
      // Check verified platforms info
      expect(responseBody.verifiedPlatforms).to.be.an('array');
      expect(responseBody.verifiedPlatforms).to.include('twitter');
    });
    
    it('should handle missing user with fallback', async () => {
      // Arrange
      req.user.id = 'user123';
      
      const userNotFoundError = new Error('User not found');
      const findUserByIdStub = sandbox.stub(User, 'findById').rejects(userNotFoundError);
      
      const mockQuests = [mockQuest];
      const findQuestsStub = sandbox.stub(Quest, 'find').resolves(mockQuests);
      
      const userConsents = [];
      const getUserConsentStatusStub = sandbox.stub(consentService, 'getUserConsentStatus').resolves(userConsents);
      
      // Add console.error stub to verify it's called
      const consoleErrorStub = sandbox.stub(console, 'error');
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(consoleErrorStub.calledOnce).to.be.true;
      expect(findQuestsStub.calledOnce).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
    });
    
    it('should handle invalid season parameter', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.season = '-1';  // Invalid
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.include('Invalid season parameter');
      expect(error.errors[0].code).to.equal('invalid_parameter');
    });
    
    it('should return empty list when user requests quests for unverified platform', async () => {
      // Arrange
      req.user.id = 'user123';
      req.query.platform = 'discord';  // User doesn't have discord verified
      
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      expect(responseBody.count).to.equal(0);
      expect(responseBody.data).to.be.an('array').that.is.empty;
      expect(responseBody.message).to.include('verify your discord account');
      expect(responseBody.verificationNeeded).to.equal('discord');
    });
    
    it('should handle consent service errors with fallback', async () => {
      // Arrange
      req.user.id = 'user123';
      
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const mockQuests = [mockQuest];
      const findQuestsStub = sandbox.stub(Quest, 'find').resolves(mockQuests);
      
      const consentError = new Error('Consent service unavailable');
      const getUserConsentStatusStub = sandbox.stub(consentService, 'getUserConsentStatus').rejects(consentError);
      
      // Add console.error stub to verify it's called
      const consoleErrorStub = sandbox.stub(console, 'error');
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(findQuestsStub.calledOnce).to.be.true;
      expect(getUserConsentStatusStub.calledWith(req.user.id)).to.be.true;
      expect(consoleErrorStub.calledOnce).to.be.true;
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody.success).to.be.true;
      
      // All quests should show as requiring consent since we couldn't verify consent
      responseBody.data.forEach(quest => {
        expect(quest.userEligibility.hasRequiredConsents).to.be.false;
        expect(quest.userEligibility.isReady).to.be.false;
      });
    });
    
    it('should handle database errors', async () => {
      // Arrange
      req.user.id = 'user123';
      
      const findUserByIdStub = sandbox.stub(User, 'findById').resolves(mockUser);
      
      const dbError = new Error('Database error');
      const findQuestsStub = sandbox.stub(Quest, 'find').rejects(dbError);
      
      // Act
      await questVerificationController.getAvailableQuests(req, res);
      
      // Assert
      expect(findUserByIdStub.calledWith(req.user.id)).to.be.true;
      expect(findQuestsStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      
      const error = next.firstCall.args[0];
      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.include('Error retrieving quests');
      expect(error.errors[0].code).to.equal('quest_retrieval_error');
    });
  });
});