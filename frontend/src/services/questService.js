import { safelyCallApi, parseApiError } from '../utils/errorHandler';

// Base API URL - should come from environment config in a real app
const API_BASE_URL = '/api';

/**
 * Makes API requests with proper error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data or error
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  // Set authentication token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Create the request configuration
  const config = {
    ...options,
    headers,
    // Set timeout to avoid hanging requests
    signal: options.signal || (AbortSignal.timeout ? AbortSignal.timeout(30000) : null)
  };
  
  return safelyCallApi(async () => {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to parse the error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If we can't parse JSON, use the status text
        throw new Error(response.statusText || `Error ${response.status}`);
      }
      
      // Throw the error with all the information
      const error = new Error(errorData.error?.message || 'API request failed');
      error.status = response.status;
      error.error = errorData.error;
      error.code = errorData.error?.code;
      
      throw error;
    }
    
    // Parse and return the successful response
    const data = await response.json();
    return {
      success: true,
      data
    };
  }, {
    fallbackMessage: 'Failed to connect to the server',
    retryCount: 2,
    shouldRetry: (error) => {
      // Only retry network errors, timeouts or server errors (5xx)
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT_ERROR' ||
        (error.status >= 500 && error.status < 600)
      );
    }
  });
};

/**
 * Quest API service
 */
const questService = {
  /**
   * Get all available quests for the user
   * @param {Object} options - Optional query parameters
   * @returns {Promise<Object>} Quest data or error
   */
  getAvailableQuests: async (options = {}) => {
    let queryParams = new URLSearchParams();
    
    // Add optional filters
    if (options.platform) queryParams.append('platform', options.platform);
    if (options.type) queryParams.append('type', options.type);
    if (options.season) queryParams.append('season', options.season);
    
    const queryString = queryParams.toString();
    const endpoint = `/quests/available${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint, { method: 'GET' });
  },
  
  /**
   * Get a specific quest by ID
   * @param {string} questId - Quest ID
   * @returns {Promise<Object>} Quest data or error
   */
  getQuest: async (questId) => {
    if (!questId) {
      return {
        success: false,
        error: parseApiError('Quest ID is required', 'MISSING_PARAMETER')
      };
    }
    
    return apiRequest(`/quests/${questId}`, { method: 'GET' });
  },
  
  /**
   * Complete a quest
   * @param {string} questId - Quest ID
   * @param {Object} proofData - Data proving quest completion
   * @returns {Promise<Object>} Completion result or error
   */
  completeQuest: async (questId, proofData = {}) => {
    if (!questId) {
      return {
        success: false,
        error: parseApiError('Quest ID is required', 'MISSING_PARAMETER')
      };
    }
    
    return apiRequest(`/quests/${questId}/complete`, {
      method: 'POST',
      body: JSON.stringify(proofData)
    });
  },
  
  /**
   * Verify a quest completion using proper consent and verification
   * @param {string} questId - Quest ID
   * @param {Object} platformData - Platform-specific verification data
   * @returns {Promise<Object>} Verification result or error
   */
  verifyQuestCompletion: async (questId, platformData = {}) => {
    if (!questId) {
      return {
        success: false,
        error: parseApiError('Quest ID is required', 'MISSING_PARAMETER')
      };
    }
    
    return apiRequest('/quests/verify', {
      method: 'POST',
      body: JSON.stringify({ questId, platformData })
    });
  },
  
  /**
   * Get user's quest completion history
   * @param {Object} options - Optional query parameters
   * @returns {Promise<Object>} Completion history or error
   */
  getQuestCompletions: async (options = {}) => {
    let queryParams = new URLSearchParams();
    
    // Add pagination and filtering
    if (options.page) queryParams.append('page', options.page);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.platform) queryParams.append('platform', options.platform);
    
    const queryString = queryParams.toString();
    const endpoint = `/quests/completions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint, { method: 'GET' });
  },
  
  /**
   * Get user's quest statistics
   * @param {number} season - Optional season number
   * @returns {Promise<Object>} Quest statistics or error
   */
  getQuestStats: async (season = null) => {
    let endpoint = '/quests/stats';
    if (season) {
      endpoint += `?season=${season}`;
    }
    
    return apiRequest(endpoint, { method: 'GET' });
  }
};

export default questService;