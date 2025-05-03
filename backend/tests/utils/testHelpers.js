/**
 * Test helpers for unit and integration tests
 */
const sinon = require('sinon');
const { APIError } = require('../../src/utils/errorHandler');

/**
 * Creates standard request, response, and next objects for controller testing
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.params - URL parameters
 * @param {Object} options.query - Query string parameters
 * @param {Object} options.body - Request body
 * @param {Object} options.user - Authentication user object
 * @param {Object} options.headers - Request headers
 * @returns {Object} Object containing req, res, and next
 */
const createMockRequestResponse = (options = {}) => {
  const sandbox = sinon.createSandbox();

  const req = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    user: options.user || { id: 'test-user-id' },
    ip: options.ip || '127.0.0.1',
    headers: options.headers || {
      'user-agent': 'test-user-agent',
      'content-type': 'application/json'
    },
    ...options.reqExtras
  };

  const res = {
    status: sandbox.stub().returnsThis(),
    json: sandbox.stub(),
    send: sandbox.stub(),
    set: sandbox.stub().returnsThis(),
    cookie: sandbox.stub().returnsThis(),
    clearCookie: sandbox.stub().returnsThis(),
    ...options.resExtras
  };

  const next = sandbox.stub();

  return { req, res, next, sandbox };
};

/**
 * Setup error handling stubs for testing controllers that use throwError
 * 
 * @param {Object} sandbox - Sinon sandbox
 * @param {Object} errorConfig - Error configuration
 * @param {string} errorConfig.message - Error message
 * @param {number} errorConfig.statusCode - HTTP status code
 * @param {Array} errorConfig.errors - Error details array
 * @returns {Object} Object containing stubs for errorHandler functions
 */
const setupErrorHandlingStubs = (sandbox, errorConfig = {}) => {
  const errorHandler = require('../../src/utils/errorHandler');
  
  // Create an APIError to throw
  const apiError = new APIError(
    errorConfig.message || 'Test error',
    errorConfig.statusCode || 400,
    errorConfig.errors || []
  );
  
  // Stub throwError to throw our API error
  const throwErrorStub = sandbox.stub(errorHandler, 'throwError').throws(apiError);
  
  return {
    throwErrorStub,
    apiError
  };
};

/**
 * Clean up test stubs and restore original methods
 * 
 * @param {Object} sandbox - Sinon sandbox
 */
const cleanupTestStubs = (sandbox) => {
  sandbox.restore();
};

/**
 * Creates standard mock objects for database models
 * 
 * @param {Object} modelConfig - Configuration for mock models
 * @returns {Object} Object containing mock objects and stubs
 */
const createMockModels = (modelConfig = {}) => {
  const sandbox = sinon.createSandbox();
  const mockModels = {};

  // Create Quest model stubs
  if (modelConfig.Quest) {
    mockModels.Quest = {
      find: sandbox.stub(),
      findById: sandbox.stub(),
      findOne: sandbox.stub(),
      findByIdAndUpdate: sandbox.stub(),
      create: sandbox.stub(),
      deleteOne: sandbox.stub(),
      countDocuments: sandbox.stub(),
      prototype: {
        save: sandbox.stub()
      }
    };

    if (modelConfig.Quest.findReturns) {
      mockModels.Quest.find.resolves(modelConfig.Quest.findReturns);
    }
    
    if (modelConfig.Quest.findByIdReturns) {
      mockModels.Quest.findById.resolves(modelConfig.Quest.findByIdReturns);
    }
  }

  // Create User model stubs
  if (modelConfig.User) {
    mockModels.User = {
      find: sandbox.stub(),
      findById: sandbox.stub(),
      findOne: sandbox.stub(),
      findByIdAndUpdate: sandbox.stub(),
      create: sandbox.stub(),
      deleteOne: sandbox.stub(),
      countDocuments: sandbox.stub(),
      prototype: {
        save: sandbox.stub()
      }
    };

    if (modelConfig.User.findByIdReturns) {
      mockModels.User.findById.resolves(modelConfig.User.findByIdReturns);
    }
  }

  // Create QuestCompletion model stubs
  if (modelConfig.QuestCompletion) {
    mockModels.QuestCompletion = {
      find: sandbox.stub(),
      findById: sandbox.stub(),
      findOne: sandbox.stub(),
      findByIdAndUpdate: sandbox.stub(),
      create: sandbox.stub(),
      deleteOne: sandbox.stub(),
      countDocuments: sandbox.stub(),
      prototype: {
        save: sandbox.stub()
      }
    };

    if (modelConfig.QuestCompletion.findReturns) {
      mockModels.QuestCompletion.find.resolves(modelConfig.QuestCompletion.findReturns);
    }
  }

  return { mockModels, sandbox };
};

/**
 * Creates mock service objects for testing controllers
 * 
 * @param {Object} serviceConfig - Configuration for mock services
 * @returns {Object} Object containing mock services and stubs
 */
const createMockServices = (serviceConfig = {}) => {
  const sandbox = sinon.createSandbox();
  const mockServices = {};

  // Create ethicalDataService stubs
  if (serviceConfig.ethicalDataService) {
    mockServices.ethicalDataService = {
      verifyQuestCompletion: sandbox.stub()
    };

    if (serviceConfig.ethicalDataService.verifyQuestCompletionReturns) {
      mockServices.ethicalDataService.verifyQuestCompletion.resolves(
        serviceConfig.ethicalDataService.verifyQuestCompletionReturns
      );
    }
  }

  // Create consentService stubs
  if (serviceConfig.consentService) {
    mockServices.consentService = {
      hasUserConsented: sandbox.stub(),
      getUserConsentStatus: sandbox.stub()
    };

    if (serviceConfig.consentService.hasUserConsentedReturns !== undefined) {
      mockServices.consentService.hasUserConsented.resolves(
        serviceConfig.consentService.hasUserConsentedReturns
      );
    }

    if (serviceConfig.consentService.getUserConsentStatusReturns) {
      mockServices.consentService.getUserConsentStatus.resolves(
        serviceConfig.consentService.getUserConsentStatusReturns
      );
    }
  }

  return { mockServices, sandbox };
};

module.exports = {
  createMockRequestResponse,
  setupErrorHandlingStubs,
  cleanupTestStubs,
  createMockModels,
  createMockServices
};