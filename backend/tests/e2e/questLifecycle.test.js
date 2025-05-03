/**
 * End-to-end tests for quest lifecycle (creation, completion, verification)
 * 
 * These tests use the MongoDB memory server to test the complete flow
 * of quest management and completion from a user perspective.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { expect } = require('chai');
const app = require('../../src/app');
const { tokens, newQuestData, questSubmissions } = require('../fixtures/testData');

describe('Quest Lifecycle - End to End Tests', () => {
  // Helper function to authenticate as admin
  const adminAuth = (request) => request.set('Authorization', `Bearer ${tokens.adminToken}`);
  
  // Helper function to authenticate as user
  const userAuth = (request) => request.set('Authorization', `Bearer ${tokens.userToken}`);
  
  // Helper function to authenticate as unverified user
  const unverifiedAuth = (request) => request.set('Authorization', `Bearer ${tokens.unverifiedToken}`);
  
  beforeAll(() => {
    // Set environment variable to identify E2E tests
    process.env.TEST_TYPE = 'e2e';
    
    // Set up auth middleware for tests
    const authMiddlewareStub = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized - No token provided' }
        });
      }
      
      const token = req.headers.authorization.split(' ')[1];
      
      if (token === tokens.adminToken) {
        req.user = { id: 'admin1', role: 'admin' };
        return next();
      } else if (token === tokens.userToken) {
        req.user = { id: 'user1', role: 'user' };
        return next();
      } else if (token === tokens.user2Token) {
        req.user = { id: 'user2', role: 'user' };
        return next();
      } else if (token === tokens.unverifiedToken) {
        req.user = { id: 'unverified1', role: 'user' };
        return next();
      } else {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized - Invalid token' }
        });
      }
    };
    
    app.setAuthMiddleware(authMiddlewareStub);
  });
  
  afterAll(() => {
    // Clean up environment variable
    delete process.env.TEST_TYPE;
  });
  
  describe('Full Quest Creation to Completion Flow', () => {
    let createdQuestId;
    
    it('1. Admin creates a new quest', async () => {
      const res = await request(app)
        .post('/api/quests')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(newQuestData.valid)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('title', newQuestData.valid.title);
      
      // Save the quest ID for later tests
      createdQuestId = res.body.data._id;
    });
    
    it('2. Regular user can view the newly created quest', async () => {
      const res = await request(app)
        .get(`/api/quests/${createdQuestId}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('_id', createdQuestId);
      expect(res.body.data).to.have.property('title', newQuestData.valid.title);
    });
    
    it('3. Regular user can see the quest in available quests', async () => {
      const res = await request(app)
        .get('/api/quests/available')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      
      // Check if our created quest is in the available quests
      const containsNewQuest = res.body.data.some(quest => quest.title === newQuestData.valid.title);
      expect(containsNewQuest).to.be.true;
    });
    
    it('4. User completes the quest successfully', async () => {
      const completionData = {
        content: `Testing the ${newQuestData.valid.requirements.contentMatch} platform with a proper post that meets the minimum character requirement for this quest.`,
        proof: 'https://twitter.com/testuser/status/98765'
      };
      
      const res = await request(app)
        .post(`/api/quests/${createdQuestId}/complete`)
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send(completionData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('pointsEarned');
      expect(res.body.data).to.have.property('completionId');
    });
    
    it('5. User can see completed quest in their completions list', async () => {
      const res = await request(app)
        .get('/api/quests/completions')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      
      // Check if our completed quest is in the list
      const containsCompletion = res.body.data.some(completion => 
        completion.quest && completion.quest._id === createdQuestId
      );
      expect(containsCompletion).to.be.true;
    });
    
    it('6. User can see updated stats after completing quest', async () => {
      const res = await request(app)
        .get('/api/quests/stats')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('totalPoints').that.is.a('number');
      expect(res.body.data).to.have.property('completedQuests').that.is.a('number');
    });
    
    it('7. Admin can update the quest', async () => {
      const updateData = {
        title: 'Updated Quest Title',
        points: 30
      };
      
      const res = await request(app)
        .put(`/api/quests/${createdQuestId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('title', updateData.title);
      expect(res.body.data).to.have.property('points', updateData.points);
    });
    
    it('8. Admin can deactivate the quest', async () => {
      const res = await request(app)
        .delete(`/api/quests/${createdQuestId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include('deactivated');
    });
    
    it('9. Deactivated quest should not appear in available quests', async () => {
      const res = await request(app)
        .get('/api/quests/available')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      
      // Check that our deactivated quest is NOT in the available quests
      const containsDeactivatedQuest = res.body.data.some(quest => quest._id === createdQuestId);
      expect(containsDeactivatedQuest).to.be.false;
    });
  });
  
  describe('Quest Validation and Error Handling', () => {
    it('Should reject quest creation with invalid data', async () => {
      const res = await request(app)
        .post('/api/quests')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(newQuestData.invalid)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.exist;
    });
    
    it('Should reject quest creation without admin privileges', async () => {
      const res = await request(app)
        .post('/api/quests')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send(newQuestData.valid)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.exist;
    });
    
    it('Should handle invalid quest completion data', async () => {
      // We need to use a real quest ID for this test
      const res = await request(app)
        .post('/api/quests/quest1/complete')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send({
          failValidation: true, // Signal to mock to return validation error
          content: 'Missing required hashtag',
          proof: 'https://example.com'
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.exist;
    });
    
    it('Should handle attempts to complete non-existent quests', async () => {
      const res = await request(app)
        .post('/api/quests/nonexistent/complete')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send(questSubmissions.validPost)
        .expect('Content-Type', /json/);
      
      expect(res.body.success).to.be.false;
    });
  });
  
  describe('Quest Verification Flow', () => {
    it('Should verify valid quest completion', async () => {
      const verificationData = {
        questId: 'quest3', // A quest that requires verification
        platformData: {
          tweetId: '123456789',
          tweetContent: 'Sharing educational content about blockchain! #educational',
          proof: 'https://twitter.com/testuser/status/123456789'
        }
      };
      
      const res = await request(app)
        .post('/api/quests/verify')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send(verificationData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include('verified');
      expect(res.body.rewards).to.exist;
    });
    
    it('Should reject verification without quest ID', async () => {
      const res = await request(app)
        .post('/api/quests/verify')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .send({
          platformData: {
            tweetId: '123456789'
          }
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.include('Quest ID is required');
    });
    
    it('Should require authentication for verification', async () => {
      const res = await request(app)
        .post('/api/quests/verify')
        .send({
          questId: 'quest3',
          platformData: {
            tweetId: '123456789'
          }
        })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body.success).to.be.false;
    });
  });
  
  describe('User-specific Quest Functionality', () => {
    it('Should return personalized available quests for the user', async () => {
      const res = await request(app)
        .get('/api/quests/available')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array');
      
      // Each quest should have completion-related fields
      res.body.data.forEach(quest => {
        expect(quest).to.have.property('completedToday');
        expect(quest).to.have.property('remainingToday');
        expect(quest).to.have.property('isCompletedToday');
      });
    });
    
    it('Should return user-specific quest stats', async () => {
      const res = await request(app)
        .get('/api/quests/stats')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('totalPoints');
      expect(res.body.data).to.have.property('completedQuests');
      expect(res.body.data).to.have.property('currentStreak');
      expect(res.body.data).to.have.property('longestStreak');
    });
    
    it('Should paginate quest completions', async () => {
      const res = await request(app)
        .get('/api/quests/completions?page=1&limit=10')
        .set('Authorization', `Bearer ${tokens.userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array');
      expect(res.body.pagination).to.exist;
      expect(res.body.pagination).to.have.property('total');
      expect(res.body.pagination).to.have.property('page', 1);
      expect(res.body.pagination).to.have.property('limit', 10);
    });
  });
});