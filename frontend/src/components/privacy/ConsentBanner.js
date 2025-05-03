import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Consent Banner Component
 * 
 * Displays a banner when the user needs to set up their consent preferences
 * or when their consent settings need to be reviewed.
 */
const ConsentBanner = () => {
  const { isAuthenticated, needsConsentSetup, consentStatus } = useAuth();
  
  // Only show banner if user is authenticated and needs consent setup
  if (!isAuthenticated || !needsConsentSetup()) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-blue-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-blue-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white">
                <span className="md:hidden">
                  Privacy settings need attention!
                </span>
                <span className="hidden md:inline">
                  {!consentStatus.initialized 
                    ? 'Your privacy preferences need to be set up.' 
                    : 'Your privacy settings need to be reviewed.'}
                </span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <Link
                to="/privacy-settings"
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
              >
                {!consentStatus.initialized 
                  ? 'Complete Setup' 
                  : 'Review Settings'}
              </Link>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                className="-mr-1 flex p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;