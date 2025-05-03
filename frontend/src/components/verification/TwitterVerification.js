import React, { useState } from 'react';

const TwitterVerification = ({ status, onStartVerification, onCompleteVerification, loading }) => {
  const [twitterUsername, setTwitterUsername] = useState('');
  const [step, setStep] = useState(status?.verified ? 'verified' : 'input');
  const [verificationCode, setVerificationCode] = useState('');
  const [formError, setFormError] = useState('');

  // Step 1: Submit Twitter username to start verification
  const handleStartVerification = async (e) => {
    e.preventDefault();
    
    if (!twitterUsername || twitterUsername.trim() === '') {
      setFormError('Please enter your Twitter username');
      return;
    }
    
    if (twitterUsername.startsWith('@')) {
      setTwitterUsername(twitterUsername.substring(1));
    }
    
    setFormError('');
    
    try {
      const result = await onStartVerification(twitterUsername);
      
      if (result) {
        setVerificationCode(result.verificationCode);
        setStep('verification');
      }
    } catch (error) {
      setFormError('Failed to start verification process. Please try again.');
    }
  };

  // Step 2: Verify Twitter account after posting verification code
  const handleCompleteVerification = async (e) => {
    e.preventDefault();
    
    try {
      const result = await onCompleteVerification(twitterUsername);
      
      if (result) {
        setStep('verified');
      }
    } catch (error) {
      setFormError('Verification failed. Make sure you posted the verification code and try again.');
    }
  };

  // Reset verification process
  const handleReset = () => {
    setStep('input');
    setTwitterUsername('');
    setVerificationCode('');
    setFormError('');
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-blue-500 text-white flex items-center">
        <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
        <h3 className="text-lg font-medium">Twitter Verification</h3>
      </div>
      
      <div className="p-6">
        {step === 'input' && (
          <form onSubmit={handleStartVerification}>
            <div className="mb-4">
              <label htmlFor="twitter-username" className="block text-sm font-medium text-gray-700 mb-1">
                Twitter Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">@</span>
                </div>
                <input
                  type="text"
                  id="twitter-username"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="username"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter your Twitter username without the @ symbol.
              </p>
            </div>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 mb-6">
              <h3 className="font-semibold mb-1">Privacy Information</h3>
              <p>
                To verify your account, we'll generate a code for you to tweet. We only check for this specific tweet
                to confirm you own the account. We <strong>do not</strong> collect your tweet history or other profile data without your explicit consent.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Start Verification'
                )}
              </button>
            </div>
          </form>
        )}
        
        {step === 'verification' && (
          <div>
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Almost there! Post this verification code on Twitter</h4>
              <p className="text-gray-700 mb-4">
                To verify your account, please post the following code as a tweet on your Twitter account:
              </p>
              
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 font-mono text-lg text-center mb-4">
                {verificationCode}
              </div>
              
              <div className="flex space-x-2 mb-4">
                <a
                  href={`https://twitter.com/intent/tweet?text=${verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Tweet This Code
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(verificationCode);
                    alert('Verification code copied to clipboard!');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                  </svg>
                  Copy Code
                </button>
              </div>
            </div>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            
            <div className="text-sm text-gray-500 mb-6">
              <p>
                <strong>Note:</strong> Your tweet must be public and posted on your main timeline (not as a reply). 
                After posting, click the "Verify" button below.
              </p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                Start Over
              </button>
              
              <button
                onClick={handleCompleteVerification}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify My Account'
                )}
              </button>
            </div>
          </div>
        )}
        
        {step === 'verified' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">Twitter Account Verified!</h3>
            
            <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-700">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              @{status?.username || twitterUsername}
            </div>
            
            <p className="text-gray-600 mb-6">
              Your Twitter account has been successfully verified. You can now participate in Twitter-related quests and activities.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 mb-6 text-left">
              <h3 className="font-semibold mb-1">What happens now?</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Your Twitter account verification status is stored in our system</li>
                <li>You can now participate in quests that require Twitter verification</li>
                <li>You'll earn rewards for completing Twitter-related quests</li>
                <li>You can revoke access at any time in Privacy Settings</li>
              </ul>
            </div>
            
            <div className="flex justify-center space-x-4">
              <a
                href="/quests"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Available Quests
              </a>
              
              <a
                href="/privacy-settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Privacy Settings
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterVerification;