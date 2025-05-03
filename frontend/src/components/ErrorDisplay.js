import React from 'react';

/**
 * Error message component for displaying API errors in a user-friendly way
 * with appropriate fallback actions and suggestions
 */
const ErrorDisplay = ({ 
  error, 
  onRetry = null, 
  onDismiss = null, 
  className = '' 
}) => {
  if (!error) return null;
  
  // Parse the error object to display meaningful messages
  let title = 'Error';
  let message = 'An unexpected error occurred.';
  let details = null;
  let retryable = false;
  let suggestions = [];
  
  // Handle different error formats
  if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    message = error.message;
    
    if (error.code) {
      // Add more specific information based on error code
      switch (error.code) {
        case 'DATABASE_TIMEOUT':
        case 'SERVICE_UNAVAILABLE':
        case 'NETWORK_ERROR':
          title = 'Connection Error';
          message = 'We\'re having trouble connecting to our servers.';
          details = error.message;
          retryable = true;
          suggestions = ['Check your internet connection', 'Try again in a few moments'];
          break;
          
        case 'QUEST_NOT_FOUND':
        case 'RESOURCE_NOT_FOUND':
          title = 'Not Found';
          message = 'The requested resource could not be found.';
          details = error.message;
          suggestions = ['Refresh the page to see available quests'];
          break;
          
        case 'VALIDATION_ERROR':
        case 'INVALID_INPUT':
          title = 'Invalid Input';
          message = 'There was a problem with the data you provided.';
          details = error.message;
          suggestions = ['Check your inputs and try again'];
          break;
          
        case 'CONSENT_REQUIRED':
          title = 'Consent Required';
          message = 'You need to provide consent before completing this action.';
          details = error.details?.consentReason || error.message;
          suggestions = ['Go to Privacy Settings to manage your consent preferences'];
          break;
          
        case 'VERIFICATION_REQUIRED':
          title = 'Verification Required';
          message = 'Your account needs to be verified first.';
          details = `Please verify your ${error.details?.platform || 'social media'} account.`;
          suggestions = ['Go to Account Verification to complete this step'];
          break;
          
        case 'DAILY_LIMIT_REACHED':
          title = 'Limit Reached';
          message = 'You\'ve reached the daily limit for this quest.';
          details = error.message;
          suggestions = ['Try a different quest', 'Come back tomorrow for more opportunities'];
          break;
          
        case 'RATE_LIMITED':
          title = 'Too Many Attempts';
          message = 'You\'ve made too many attempts in a short time.';
          details = error.message;
          suggestions = [`Try again ${error.retryAfter ? `in ${Math.ceil(error.retryAfter / 60)} minutes` : 'later'}`];
          retryable = false;
          break;
          
        default:
          // Use the generic message
      }
    }
    
    // Add suggestions from the error if available
    if (error.suggestions && Array.isArray(error.suggestions)) {
      suggestions = [...suggestions, ...error.suggestions];
    }
    
    // Set retryable flag from error object if present
    if (error.retryable !== undefined) {
      retryable = error.retryable;
    }
  }
  
  // Determine icon based on error type
  let icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  );
  
  if (title === 'Connection Error' || title === 'Service Unavailable') {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625zm16.125-.375a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 7.125v-1.5a.375.375 0 00-.375-.375h-1.5zM21 9.375A.375.375 0 0020.625 9h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zM4.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5zM3.375 15h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h1.5a.375.375 0 00.375-.375v-1.5A.375.375 0 004.875 9h-1.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375zm4.125 0a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9z" clipRule="evenodd" />
      </svg>
    );
  } else if (title === 'Limit Reached' || title === 'Too Many Attempts') {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
      </svg>
    );
  } else if (title === 'Verification Required' || title === 'Consent Required') {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    );
  }
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0 text-red-500">
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {details && <p className="mt-1 text-xs opacity-80">{details}</p>}
            
            {suggestions.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-xs">Suggestions:</p>
                <ul className="list-disc pl-5 mt-1 text-xs space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex space-x-3">
            {retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;