import React, { useState } from 'react';

const DataDeletionRequest = ({ onRequestDeletion }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleRequestDeletion = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    // Check if the confirmation text is correct
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm account deletion.');
      return;
    }

    try {
      setIsProcessing(true);
      await onRequestDeletion();
      // Reset states after successful request
      setIsConfirming(false);
      setConfirmText('');
    } catch (error) {
      console.error('Error during deletion request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      <div className="bg-red-50 px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-red-900">Delete Your Account & Data</h3>
        <div className="mt-2 text-sm text-red-700">
          <p>
            Request permanent deletion of your account and all associated personal data from our system. This action cannot be undone.
          </p>
        </div>

        {isConfirming ? (
          <div className="mt-4 p-4 bg-white rounded-md border border-red-300">
            <p className="text-sm text-gray-700 mb-4">
              <strong>Warning:</strong> This will permanently delete your account and all associated data. You will lose access to your profile, history, and any rewards or achievements. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-1">
                Please type DELETE to confirm
              </label>
              <input
                type="text"
                id="confirm-delete"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestDeletion}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                  'Permanently Delete My Account'
                )}
              </button>
              <button
                onClick={() => {
                  setIsConfirming(false);
                  setConfirmText('');
                }}
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
              onClick={handleRequestDeletion}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Request Account Deletion
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-red-50 text-xs text-red-900 border-t border-red-200">
        <p>
          In compliance with GDPR and similar regulations, we provide the right to request deletion of your personal data.
        </p>
      </div>
    </div>
  );
};

export default DataDeletionRequest;