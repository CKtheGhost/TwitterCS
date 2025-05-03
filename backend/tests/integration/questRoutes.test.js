const request = require('supertest');
const mongoose = require('mongoose');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../src/app'); // Import the express app
const questService = require('../../src/services/questService');
const Quest = require('../../src/models/Quest');
const QuestCompletion = require('../../src/models/QuestCompletion');
const User = require('../../src/models/User');

describe('Quest API Routes - Integration Tests', () => {
  let sandbox;
  let adminToken, userToken;
  
  beforeAll(async () => {
    // Set environment variable to identify integration tests
    process.env.TEST_TYPE = 'integration';
    
    // Create sandbox
    sandbox = sinon.createSandbox();
    
    // Mock tokens for testing
    adminToken = 'admin-jwt-token';
    userToken = 'user-jwt-token';
    
    // Set up authentication middleware for tests
    const authMiddlewareStub = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Unauthorized - No token provided',
            details: [{ code: 'auth_error' }]
          }
        });
      }
      
      const token = req.headers.authorization.split(' ')[1];
      
      if (token === adminToken) {
        req.user = { id: 'admin1', role: 'admin' };
        return next();
      } else if (token === userToken) {
        req.user = { id: 'user1', role: 'user' };
        return next();
      } else {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Unauthorized - Invalid token',
            details: [{ code: 'auth_error' }]
          }
        });
      }
    };
    
    // Set the auth middleware on the app
    app.setAuthMiddleware(authMiddlewareStub);
  });
  
  afterAll(async () => {
    sandbox.restore();
    // Clean up environment variable
    delete process.env.TEST_TYPE;
  });
  
  beforeEach(() => {
    sandbox.reset();
  });
  
  describe('GET /api/quests', () => {
    it('should return all active quests', async () => {
      const res = await request(app)
        .get('/api/quests')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(2);
      expect(res.body.data.length).to.equal(2);
      // First quest from our mock data in setupTests.js
      expect(res.body.data[0].title).to.equal('Test Quest 1');
      expect(res.body.data[0].type).to.equal('post');
      // Second quest from our mock data
      expect(res.body.data[1].title).to.equal('Test Quest 2');
      expect(res.body.data[1].type).to.equal('like');
    });
  });
  
  describe('GET /api/quests/:id', () => {
    it('should return a single quest by ID', async () => {
      const res = await request(app)
        .get('/api/quests/quest1')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data._id).to.equal('quest1');
      expect(res.body.data.title).to.equal('Test Quest 1');
      expect(res.body.data.points).to.equal(10);
    });
    
    it('should return 404 for non-existent quest', async () => {
      // Our model mock handles non-existent IDs
      const res = await request(app)
        .get('/api/quests/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Quest not found');
    });
  });
  
  describe('POST /api/quests', () => {
    it('should allow admin to create a quest', async () => {
      // Prepare data for creating a new quest
      const newQuest = {
        title: 'New Quest',
        description: 'New Description',
        type: 'post',
        platform: 'twitter',
        action: 'post',
        points: 10,
        dailyLimit: 1,
        season: 1
      };
      
      // Mock the createQuest service method
      sandbox.stub(questService, 'createQuest').resolves({
        _id: 'new-quest-id',
        ...newQuest,
        isActive: true,
        createdBy: 'admin1'
      });
      
      // Send request as admin
      const res = await request(app)
        .post('/api/quests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newQuest)
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Verify response
      expect(res.body.success).to.be.true;
      expect(res.body.data.title).to.equal(newQuest.title);
      expect(res.body.data.description).to.equal(newQuest.description);
      expect(res.body.data.type).to.equal(newQuest.type);
      expect(res.body.data.createdBy).to.equal('admin1');
    });
    
    it('should deny quest creation to non-admin users', async () => {
      // Prepare data for creating a new quest
      const newQuest = {
        title: 'New Quest',
        description: 'New Description'
      };
      
      // Send request as regular user
      const res = await request(app)
        .post('/api/quests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newQuest)
        .expect('Content-Type', /json/)
        .expect(403);
      
      // Verify response
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Not authorized to create quests');
    });
    
    it('should require authentication', async () => {
      // Send request with no token
      const res = await request(app)
        .post('/api/quests')
        .send({ title: 'New Quest' })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Unauthorized');
    });
  });
  
  describe('PUT /api/quests/:id', () => {
    it('should allow admin to update a quest', async () => {
      const questId = 'quest1';
      const updateData = { title: 'Updated Quest Title' };
      
      // Setup stub to return the mock quest
      const updatedQuest = {
        _id: questId,
        title: 'Updated Quest Title',
        description: 'Test Description 1',
        type: 'post',
        platform: 'twitter',
        isActive: true
      };
      
      // We'll use the default Quest.findById from setupTests.js
      // And just stub the findByIdAndUpdate to return our custom updated quest
      sandbox.stub(Quest, 'findByIdAndUpdate').resolves(updatedQuest);
      
      // Send update request as admin
      const res = await request(app)
        .put(`/api/quests/${questId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data.title).to.equal(updateData.title);
    });
    
    it('should deny quest updates to non-admin users', async () => {
      const questId = 'quest1';
      const updateData = { title: 'Updated Quest Title' };
      
      // Send update request as regular user
      const res = await request(app)
        .put(`/api/quests/${questId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Not authorized to update quests');
    });
  });
  
  describe('DELETE /api/quests/:id', () => {
    it('should allow admin to deactivate a quest', async () => {
      const questId = 'quest1';
      
      // Send delete request as admin
      const res = await request(app)
        .delete(`/api/quests/${questId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include('successfully deactivated');
      // We don't check mockQuest.isActive since we're not using a real mock anymore
    });
    
    it('should deny quest deletion to non-admin users', async () => {
      const questId = 'quest1';
      
      // Send delete request as regular user
      const res = await request(app)
        .delete(`/api/quests/${questId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Not authorized to delete quests');
    });
  });
  
  describe('GET /api/quests/available', () => {
    it('should return available quests for the authenticated user', async () => {
      // Send request as authenticated user
      const res = await request(app)
        .get('/api/quests/available')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);
      // We don't compare exact objects since our mock might have additional fields
      expect(res.body.data).to.be.an('array');
      expect(res.body.data[0]._id).to.equal('quest1');
      expect(res.body.data[0].title).to.equal('Test Quest 1');
    });
    
    it('should require authentication', async () => {
      // Send request without token
      const res = await request(app)
        .get('/api/quests/available')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Unauthorized');
    });
    
    it('should handle invalid season parameter', async () => {
      // Send request with invalid season
      const res = await request(app)
        .get('/api/quests/available?season=-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Invalid season value');
    });
  });
  
  describe('POST /api/quests/:id/complete', () => {
    it('should complete a quest successfully', async () => {
      const questId = 'quest1';
      const completionData = {
        content: 'Test content',
        proof: 'Test proof'
      };
      
      // Mock successful validation result
      const validationResult = {
        success: true,
        pointsEarned: 10,
        requiresReview: false,
        completion: { _id: 'completion1' }
      };
      
      // Stub the validation service
      sandbox.stub(questService, 'validateQuestCompletion').resolves(validationResult);
      
      // Send completion request
      const res = await request(app)
        .post(`/api/quests/${questId}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(completionData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data.pointsEarned).to.equal(10);
      expect(res.body.data.requiresReview).to.be.false;
      expect(res.body.data.completionId).to.equal('completion1');
    });
    
    it('should handle validation failures', async () => {
      const questId = 'quest1';
      const completionData = {
        content: 'Test content',
        proof: 'Test proof',
        failValidation: true  // Signal to our mock to return a failure
      };
      
      // Send completion request
      const res = await request(app)
        .post(`/api/quests/${questId}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(completionData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.equal('Daily limit reached');
      expect(res.body.error.details[0].code).to.equal('daily_limit_reached');
      expect(res.body.error.details[0].type).to.equal('limit');
    });
  });
  
  describe('GET /api/quests/completions', () => {
    it('should return user quest completions with pagination', async () => {
      // Mock completion data is already set up in our setupTests.js
      
      // Send request for completions
      const res = await request(app)
        .get('/api/quests/completions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);
      expect(res.body.pagination).to.exist;
      expect(res.body.pagination.total).to.equal(1);
      expect(res.body.pagination.page).to.equal(1);
    });
    
    it('should handle invalid pagination parameters', async () => {
      // Send request with invalid page number
      const res = await request(app)
        .get('/api/quests/completions?page=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Invalid pagination parameters');
    });
  });
  
  describe('GET /api/quests/stats', () => {
    it('should return user quest statistics', async () => {
      // Mock stats data
      const mockStats = {
        totalPoints: 100,
        completedQuests: 10,
        currentStreak: 3,
        longestStreak: 5
      };
      
      // Stub the service
      sandbox.stub(questService, 'getUserQuestStats').resolves(mockStats);
      
      // Send request for stats
      const res = await request(app)
        .get('/api/quests/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(mockStats);
    });
    
    it('should handle invalid season parameter', async () => {
      // Send request with invalid season
      const res = await request(app)
        .get('/api/quests/stats?season=-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Invalid season parameter');
    });
  });
});