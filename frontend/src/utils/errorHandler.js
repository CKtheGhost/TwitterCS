/**
 * Frontend error handling utilities for standardized API error handling
 */

/**
 * Parse API error response into a standardized format
 * @param {Object|Error} error - The error object from fetch or axios
 * @param {string} fallbackMessage - Fallback message if none can be extracted
 * @returns {Object} Standardized error object
 */
export const parseApiError = (error, fallbackMessage = 'An unexpected error occurred') => {
  // Default error structure
  const parsedError = {
    message: fallbackMessage,
    status: 500,
    code: 'UNKNOWN_ERROR',
    details: null,
    retryable: false,
    suggestions: []
  };
  
  try {
    // Handle Fetch API errors
    if (error instanceof Response) {
      parsedError.status = error.status;
      return {
        ...parsedError,
        message: `Server error: ${error.statusText || error.status}`,
        code: `HTTP_${error.status}`
      };
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      return {
        ...parsedError,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
        suggestions: ['Check your internet connection', 'Try again in a few moments']
      };
    }
    
    // Handle timeout errors
    if (error.name === 'TimeoutError' || (error.message && error.message.includes('timeout'))) {
      return {
        ...parsedError,
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
        retryable: true,
        suggestions: ['The server is taking too long to respond', 'Try again later']
      };
    }
    
    // Handle our custom API error format
    if (error.error && typeof error.error === 'object') {
      // This is our API's standard error format
      const { message, details, code, suggestions } = error.error;
      
      return {
        ...parsedError,
        message: message || parsedError.message,
        code: code || parsedError.code,
        status: error.status || parsedError.status,
        details: details || null,
        retryable: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'DATABASE_TIMEOUT'].includes(code),
        suggestions: suggestions || parsedError.suggestions
      };
    }
    
    // Handle JSON parsing error
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return {
        ...parsedError,
        message: 'Invalid response from server',
        code: 'INVALID_JSON',
        retryable: true
      };
    }
    
    // Handle regular Error objects
    if (error instanceof Error) {
      return {
        ...parsedError,
        message: error.message,
        code: error.code || parsedError.code,
        details: error.details || error.stack,
        retryable: error.retryable || parsedError.retryable
      };
    }
    
    // Handle object with message
    if (error && typeof error === 'object' && error.message) {
      return {
        ...parsedError,
        message: error.message,
        code: error.code || parsedError.code,
        status: error.status || parsedError.status,
        details: error.details || null,
        retryable: error.retryable || parsedError.retryable,
        suggestions: error.suggestions || parsedError.suggestions
      };
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return {
        ...parsedError,
        message: error
      };
    }
    
  } catch (err) {
    console.error('Error parsing API error:', err);
    // Return the default error structure
  }
  
  return parsedError;
};

/**
 * Safely execute an API call with proper error handling
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Options for handling the API call
 * @returns {Promise<Object>} The result or error object
 */
export const safelyCallApi = async (apiCall, options = {}) => {
  const {
    fallbackMessage = 'Failed to complete the request',
    fallbackData = null,
    onError = null,
    retryCount = 0,
    retryDelay = 1000,
    shouldRetry = null
  } = options;
  
  let attempt = 0;
  
  const makeAttempt = async () => {
    try {
      attempt++;
      return await apiCall();
    } catch (error) {
      const parsedError = parseApiError(error, fallbackMessage);
      
      // Determine if we should retry
      let shouldRetryThis = parsedError.retryable;
      if (typeof shouldRetry === 'function') {
        shouldRetryThis = shouldRetry(parsedError, attempt);
      }
      
      // Retry if conditions are met
      if (shouldRetryThis && attempt <= retryCount) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return makeAttempt();
      }
      
      // Call the onError callback if provided
      if (typeof onError === 'function') {
        onError(parsedError);
      }
      
      // No more retries, return the error
      return {
        success: false,
        error: parsedError,
        data: fallbackData
      };
    }
  };
  
  return makeAttempt();
};

/**
 * Creates standard retry logic for API calls
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay between retries in ms
 * @returns {Function} Retry handler function
 */
export const createRetryHandler = (maxRetries = 3, baseDelay = 1000) => {
  return async (apiCall, options = {}) => {
    return safelyCallApi(apiCall, {
      ...options,
      retryCount: maxRetries,
      retryDelay: baseDelay
    });
  };
};

/**
 * Custom error types for specific error scenarios
 */
export class ValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.fieldErrors = fieldErrors;
    this.retryable = false;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_ERROR';
    this.status = 401;
    this.retryable = false;
  }
}

export class ConsentRequiredError extends Error {
  constructor(message, consentType, consentReason) {
    super(message);
    this.name = 'ConsentRequiredError';
    this.code = 'CONSENT_REQUIRED';
    this.status = 403;
    this.consentType = consentType;
    this.consentReason = consentReason;
    this.retryable = false;
    this.details = {
      consentType,
      consentReason
    };
  }
}

export class VerificationRequiredError extends Error {
  constructor(message, platform) {
    super(message);
    this.name = 'VerificationRequiredError';
    this.code = 'VERIFICATION_REQUIRED';
    this.status = 400;
    this.platform = platform;
    this.retryable = false;
    this.details = {
      platform
    };
  }
}