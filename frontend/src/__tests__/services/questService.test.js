import questService from '../../services/questService';
import { parseApiError, safelyCallApi } from '../../utils/errorHandler';

// Mock utilities from errorHandler
jest.mock('../../utils/errorHandler', () => ({
  parseApiError: jest.fn(),
  safelyCallApi: jest.fn()
}));

// Mock global fetch function
global.fetch = jest.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
});

// Mock AbortSignal.timeout if not available in test environment
if (!AbortSignal.timeout) {
  AbortSignal.timeout = jest.fn().mockImplementation(() => new AbortController().signal);
}

describe('questService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default success response for safelyCallApi
    safelyCallApi.mockResolvedValue({
      success: true,
      data: { message: 'success' }
    });
    
    // Default error parsing
    parseApiError.mockImplementation((error, fallback) => ({
      message: error.message || fallback,
      code: error.code || 'UNKNOWN_ERROR'
    }));
  });

  describe('getAvailableQuests', () => {
    it('should call API with correct parameters and no filters', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          count: 2,
          data: [
            { id: 'quest1', title: 'Quest 1' },
            { id: 'quest2', title: 'Quest 2' }
          ]
        }
      };

      safelyCallApi.mockResolvedValueOnce(mockResponse);
      
      // Act
      const result = await questService.getAvailableQuests();
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // The first argument to safelyCallApi is a function, we need to mock fetch
      // to verify it works correctly
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/available',
        expect.objectContaining({
          method: 'GET'
        })
      );
      
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle filters correctly', async () => {
      // Arrange
      const filters = {
        platform: 'twitter',
        type: 'post',
        season: 1
      };
      
      // Act
      await questService.getAvailableQuests(filters);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // The first argument to safelyCallApi is a function, we need to mock fetch
      // to verify it works correctly
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      // The URL should contain all filters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/available?platform=twitter&type=post&season=1',
        expect.anything()
      );
    });
  });

  describe('getQuest', () => {
    it('should call API with correct quest ID', async () => {
      // Arrange
      const questId = 'quest123';
      
      // Act
      await questService.getQuest(questId);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/quests/${questId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('should return error when questId is missing', async () => {
      // Arrange
      parseApiError.mockReturnValueOnce({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // Act
      const result = await questService.getQuest();
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // safelyCallApi should not be called
      expect(safelyCallApi).not.toHaveBeenCalled();
    });
  });

  describe('completeQuest', () => {
    it('should call API with correct parameters', async () => {
      // Arrange
      const questId = 'quest123';
      const proofData = {
        content: 'I completed this quest!',
        screenshot: 'data:image/jpeg;base64,abc123'
      };
      
      // Act
      await questService.completeQuest(questId, proofData);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/quests/${questId}/complete`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(proofData)
        })
      );
    });
    
    it('should return error when questId is missing', async () => {
      // Arrange
      parseApiError.mockReturnValueOnce({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // Act
      const result = await questService.completeQuest();
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // safelyCallApi should not be called
      expect(safelyCallApi).not.toHaveBeenCalled();
    });
  });

  describe('verifyQuestCompletion', () => {
    it('should call API with correct parameters', async () => {
      // Arrange
      const questId = 'quest123';
      const platformData = {
        tweetId: '12345',
        tweetContent: 'I just completed a quest!'
      };
      
      // Act
      await questService.verifyQuestCompletion(questId, platformData);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ questId, platformData })
        })
      );
    });
    
    it('should return error when questId is missing', async () => {
      // Arrange
      parseApiError.mockReturnValueOnce({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // Act
      const result = await questService.verifyQuestCompletion();
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Quest ID is required',
        code: 'MISSING_PARAMETER'
      });
      
      // safelyCallApi should not be called
      expect(safelyCallApi).not.toHaveBeenCalled();
    });
  });

  describe('getQuestCompletions', () => {
    it('should call API with correct parameters and no filters', async () => {
      // Act
      await questService.getQuestCompletions();
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/completions',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('should handle pagination and filtering', async () => {
      // Arrange
      const options = {
        page: 2,
        limit: 10,
        platform: 'twitter'
      };
      
      // Act
      await questService.getQuestCompletions(options);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      // URL should contain all parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/completions?page=2&limit=10&platform=twitter',
        expect.anything()
      );
    });
  });

  describe('getQuestStats', () => {
    it('should call API without season parameter when not provided', async () => {
      // Act
      await questService.getQuestStats();
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/stats',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('should include season parameter when provided', async () => {
      // Arrange
      const season = 2;
      
      // Act
      await questService.getQuestStats(season);
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right endpoint
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quests/stats?season=2',
        expect.anything()
      );
    });
  });

  describe('apiRequest function', () => {
    it('should add authentication token to headers when available', async () => {
      // Arrange
      localStorage.getItem.mockReturnValueOnce('dummy-token');
      
      // Act
      await questService.getQuest('quest123');
      
      // Assert
      expect(safelyCallApi).toHaveBeenCalledTimes(1);
      
      // Check that we're making the right request with the right headers
      const apiCallFn = safelyCallApi.mock.calls[0][0];
      
      // Mock fetch for the API call function
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      });
      
      await apiCallFn();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer dummy-token'
          })
        })
      );
    });
    
    it('should handle API error responses', async () => {
      // Arrange
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValueOnce({
          error: {
            message: 'Invalid quest ID format',
            code: 'VALIDATION_ERROR'
          }
        })
      };
      
      // Set up fetch to return an error
      global.fetch.mockResolvedValueOnce(errorResponse);
      
      // Mock safelyCallApi to actually call the function
      safelyCallApi.mockImplementationOnce(async (fn) => {
        try {
          return await fn();
        } catch (error) {
          return {
            success: false,
            error
          };
        }
      });
      
      // Act
      const result = await questService.getQuest('invalid-id');
      
      // Assert
      expect(result.success).toBe(false);
      expect(errorResponse.json).toHaveBeenCalledTimes(1);
      expect(result.error).toBeDefined();
    });
  });
});