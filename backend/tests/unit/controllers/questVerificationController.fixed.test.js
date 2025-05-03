/**
 * Unit tests for Quest Verification Controller with improved testing approach
 */
const { expect } = require('chai');
const questVerificationController = require('../../../src/controllers/questVerificationController');
const {
  createMockRequestResponse,
  setupErrorHandlingStubs,
  createMockModels,
  createMockServices
} = require('../../utils/testHelpers');

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

describe('Quest Verification Controller (Fixed Tests)', () => {
  let mocks;
  
  beforeEach(() => {
    // Create fresh mocks for each test
    const { req, res, next, sandbox } = createMockRequestResponse({
      user: { id: 'user123' }
    });
    
    mocks = { req, res, next, sandbox };
  });
  
  afterEach(() => {
    // Restore all stubs
    if (mocks.sandbox) {
      mocks.sandbox.restore();
    }
  });
  
  describe('verifyQuestCompletion', () => {
    it('should successfully verify a quest completion', async () => {
      // Prepare mock data
      mocks.req.body = {
        questId: 'quest123',
        platformData: {
          tweetId: '12345',
          tweetContent: '#test content'
        }
      };
      
      // Create mock models and stubs
      const { mockModels, sandbox: modelSandbox } = createMockModels({
        Quest: {
          findByIdReturns: mockQuest
        },
        User: {
          findByIdReturns: mockUser
        },
        QuestCompletion: {}
      });
      
      // Mock model methods
      mockModels.Quest.findById.resolves(mockQuest);
      mockModels.User.findById.resolves(mockUser);
      mockModels.QuestCompletion.prototype.save.resolves();
      mockModels.User.findByIdAndUpdate.resolves(mockUser);
      
      // Create mock services
      const { mockServices, sandbox: serviceSandbox } = createMockServices({
        ethicalDataService: {
          verifyQuestCompletionReturns: {
            verified: true,
            verificationData: {
              type: 'api',
              timestamp: new Date(),
              success: true
            }
          }
        },
        consentService: {
          hasUserConsentedReturns: true
        }
      });
      
      // Apply mocks using monkey patching
      const Quest = require('../../../src/models/Quest');
      const User = require('../../../src/models/User');
      const QuestCompletion = require('../../../src/models/QuestCompletion');
      const ethicalDataService = require('../../../src/services/ethicalDataService');
      const consentService = require('../../../src/services/consentService');
      
      // Store original methods
      const originalQuestFindById = Quest.findById;
      const originalUserFindById = User.findById;
      const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
      const originalQuestCompletionSave = QuestCompletion.prototype.save;
      const originalVerifyQuestCompletion = ethicalDataService.verifyQuestCompletion;
      const originalHasUserConsented = consentService.hasUserConsented;
      
      // Replace with stubs
      Quest.findById = mockModels.Quest.findById;
      User.findById = mockModels.User.findById;
      User.findByIdAndUpdate = mockModels.User.findByIdAndUpdate;
      QuestCompletion.prototype.save = mockModels.QuestCompletion.prototype.save;
      ethicalDataService.verifyQuestCompletion = mockServices.ethicalDataService.verifyQuestCompletion;
      consentService.hasUserConsented = mockServices.consentService.hasUserConsented;
      
      try {
        // Act
        await questVerificationController.verifyQuestCompletion(mocks.req, mocks.res, mocks.next);
        
        // Assert
        expect(mockModels.Quest.findById.calledWith(mocks.req.body.questId)).to.be.true;
        expect(mockServices.consentService.hasUserConsented.calledOnce).to.be.true;
        expect(mockModels.User.findById.calledWith(mocks.req.user.id)).to.be.true;
        expect(mockServices.ethicalDataService.verifyQuestCompletion.calledOnce).to.be.true;
        expect(mockModels.QuestCompletion.prototype.save.calledOnce).to.be.true;
        expect(mockModels.User.findByIdAndUpdate.calledOnce).to.be.true;
        
        // Check response
        expect(mocks.res.status.calledWith(200)).to.be.true;
        expect(mocks.res.json.calledOnce).to.be.true;
        
        const responseBody = mocks.res.json.firstCall.args[0];
        expect(responseBody.success).to.be.true;
        expect(responseBody.message).to.include('verified');
        expect(responseBody.rewards).to.deep.equal(mockQuest.rewards);
      } finally {
        // Restore original methods
        Quest.findById = originalQuestFindById;
        User.findById = originalUserFindById;
        User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
        QuestCompletion.prototype.save = originalQuestCompletionSave;
        ethicalDataService.verifyQuestCompletion = originalVerifyQuestCompletion;
        consentService.hasUserConsented = originalHasUserConsented;
        
        // Cleanup
        modelSandbox.restore();
        serviceSandbox.restore();
      }
    });
    
    it('should return 400 when questId is missing', async () => {
      // Prepare mock data
      mocks.req.body = {
        platformData: { tweetId: '12345' }
      };
      
      // Setup error handling
      const { throwErrorStub, apiError } = setupErrorHandlingStubs(mocks.sandbox, {
        message: 'Quest ID is required',
        statusCode: 400,
        errors: [{
          type: 'validation',
          code: 'missing_field',
          field: 'questId',
          message: 'The quest ID field is required for verification'
        }]
      });
      
      try {
        // Act
        await questVerificationController.verifyQuestCompletion(mocks.req, mocks.res, mocks.next);
        
        // Assert
        expect(throwErrorStub.calledOnce).to.be.true;
        expect(mocks.next.calledOnce).to.be.true;
        
        const error = mocks.next.firstCall.args[0];
        expect(error).to.equal(apiError);
        expect(error.message).to.include('Quest ID is required');
        expect(error.statusCode).to.equal(400);
        expect(error.errors[0].code).to.equal('missing_field');
      } finally {
        // Cleanup handled by afterEach
      }
    });
    
    it('should return 404 when quest is not found', async () => {
      // Prepare mock data
      mocks.req.body = {
        questId: 'nonexistent',
        platformData: { tweetId: '12345' }
      };
      
      // Create mock models
      const { mockModels, sandbox: modelSandbox } = createMockModels({
        Quest: {
          findByIdReturns: null
        }
      });
      
      // Setup error handling
      const { throwErrorStub, apiError } = setupErrorHandlingStubs(mocks.sandbox, {
        message: 'Quest not found',
        statusCode: 404,
        errors: [{
          type: 'resource',
          code: 'quest_not_found',
          message: `Quest with ID ${mocks.req.body.questId} does not exist`
        }]
      });
      
      // Apply mocks
      const Quest = require('../../../src/models/Quest');
      const originalQuestFindById = Quest.findById;
      Quest.findById = mockModels.Quest.findById;
      
      try {
        // Act
        await questVerificationController.verifyQuestCompletion(mocks.req, mocks.res, mocks.next);
        
        // Assert
        expect(mockModels.Quest.findById.calledWith(mocks.req.body.questId)).to.be.true;
        expect(throwErrorStub.calledOnce).to.be.true;
        expect(mocks.next.calledOnce).to.be.true;
        
        const error = mocks.next.firstCall.args[0];
        expect(error).to.equal(apiError);
        expect(error.message).to.include('Quest not found');
        expect(error.statusCode).to.equal(404);
        expect(error.errors[0].code).to.equal('quest_not_found');
      } finally {
        // Restore original methods
        Quest.findById = originalQuestFindById;
        
        // Cleanup
        modelSandbox.restore();
      }
    });
    
    it('should return 403 when user has not consented', async () => {
      // Prepare mock data
      mocks.req.body = {
        questId: 'quest123',
        platformData: { tweetId: '12345' }
      };
      
      // Create mock models and services
      const { mockModels, sandbox: modelSandbox } = createMockModels({
        Quest: {
          findByIdReturns: mockQuest
        }
      });
      
      const { mockServices, sandbox: serviceSandbox } = createMockServices({
        consentService: {
          hasUserConsentedReturns: false
        }
      });
      
      // Setup error handling
      const { throwErrorStub, apiError } = setupErrorHandlingStubs(mocks.sandbox, {
        message: 'Consent required for quest verification',
        statusCode: 403,
        errors: [{
          type: 'consent',
          code: 'consent_required',
          consentType: 'dataUsage.publicProfile',
          message: 'This quest requires verification of your twitter post actions'
        }]
      });
      
      // Apply mocks
      const Quest = require('../../../src/models/Quest');
      const consentService = require('../../../src/services/consentService');
      
      const originalQuestFindById = Quest.findById;
      const originalHasUserConsented = consentService.hasUserConsented;
      
      Quest.findById = mockModels.Quest.findById;
      consentService.hasUserConsented = mockServices.consentService.hasUserConsented;
      
      try {
        // Act
        await questVerificationController.verifyQuestCompletion(mocks.req, mocks.res, mocks.next);
        
        // Assert
        expect(mockModels.Quest.findById.calledWith(mocks.req.body.questId)).to.be.true;
        expect(mockServices.consentService.hasUserConsented.calledOnce).to.be.true;
        expect(throwErrorStub.calledOnce).to.be.true;
        expect(mocks.next.calledOnce).to.be.true;
        
        const error = mocks.next.firstCall.args[0];
        expect(error).to.equal(apiError);
        expect(error.message).to.include('Consent required');
        expect(error.statusCode).to.equal(403);
        expect(error.errors[0].code).to.equal('consent_required');
      } finally {
        // Restore original methods
        Quest.findById = originalQuestFindById;
        consentService.hasUserConsented = originalHasUserConsented;
        
        // Cleanup
        modelSandbox.restore();
        serviceSandbox.restore();
      }
    });
  });
});