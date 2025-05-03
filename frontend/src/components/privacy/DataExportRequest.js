import React, { useState } from 'react';

const DataExportRequest = ({ onRequestExport }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRequestExport = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      setIsProcessing(true);
      await onRequestExport();
      // Reset states after successful request
      setIsConfirming(false);
    } catch (error) {
      console.error('Error during export request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-blue-50 px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-blue-900">Export Your Data</h3>
        <div className="mt-2 text-sm text-blue-700">
          <p>
            Request a copy of all your personal data stored in our system. This includes your profile information, consent settings, and activity history.
          </p>
        </div>

        {isConfirming ? (
          <div className="mt-4 p-4 bg-white rounded-md border border-blue-300">
            <p className="text-sm text-gray-700 mb-4">
              Your data will be compiled and sent to your registered email address. This process typically takes 24-48 hours. Would you like to proceed?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestExport}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Yes, Export My Data'
                )}
              </button>
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleRequestExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Request Data Export
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-blue-50 text-xs text-blue-900 border-t border-blue-200">
        <p>
          In compliance with GDPR and similar regulations, we provide a complete export of your personal data upon request.
        </p>
      </div>
    </div>
  );
};

export default DataExportRequest;