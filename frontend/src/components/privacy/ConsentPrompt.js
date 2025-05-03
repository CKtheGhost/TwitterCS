import React from 'react';

const ConsentPrompt = ({ consentType, onProvideConsent, onDecline }) => {
  // Format the consent type for display
  const formatConsentType = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .split('.')
      .map(part => 
        part.replace(/([A-Z])/g, ' $1') // Add space before capital letters
           .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      )
      .join(' › ');
  };

  // Get appropriate description and details based on consent type
  const getConsentDetails = (type) => {
    // Default details
    let title = 'Consent Required';
    let description = 'Additional consent is required to proceed.';
    let dataCollected = ['Your consent preference'];
    let dataPurpose = 'To respect your privacy choices';
    let privacyImpact = 'Minimal - only your consent preference will be stored';
    
    // Specific details based on consent type
    if (type === 'socialVerification.twitter') {
      title = 'Twitter Verification Consent';
      description = 'To verify your Twitter account, we need your consent to check your Twitter profile for the verification code.';
      dataCollected = ['Twitter username', 'Verification status', 'Verification timestamp'];
      dataPurpose = 'To verify your account ownership without collecting your tweets or other private data';
      privacyImpact = 'Low - we only check for the verification code tweet and store your verification status';
    } 
    else if (type === 'dataUsage.publicProfile') {
      title = 'Public Profile Data Consent';
      description = 'To display profile information, we need your consent to access your public profile data.';
      dataCollected = ['Public profile information (name, username, profile picture, bio)', 'Account verification badge status'];
      dataPurpose = 'To display and verify your public profile information';
      privacyImpact = 'Low - we only access publicly available profile information with your consent';
    }
    else if (type === 'dataUsage.engagementMetrics') {
      title = 'Engagement Metrics Consent';
      description = 'To verify quest completion, we need your consent to check your public engagement metrics.';
      dataCollected = ['Public engagement metrics (followers, following, likes, retweets)', 'Interaction with specified content'];
      dataPurpose = 'To verify quest completion and calculate rewards';
      privacyImpact = 'Medium - we check your public engagement metrics for specific verification purposes only';
    }
    
    return { title, description, dataCollected, dataPurpose, privacyImpact };
  };
  
  const details = getConsentDetails(consentType);

  return (
    <div className="mb-6 rounded-lg overflow-hidden border border-blue-200">
      <div className="bg-blue-100 px-4 py-3 flex items-center">
        <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-medium text-blue-700">{details.title}</h3>
      </div>
      
      <div className="p-4 bg-white">
        <p className="text-gray-700 mb-4">
          {details.description}
        </p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Consent:</h4>
          <div className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm">
            {formatConsentType(consentType)}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Data Collected:</h4>
          <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
            {details.dataCollected.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Purpose:</h4>
          <p className="text-sm text-gray-600">{details.dataPurpose}</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Privacy Impact:</h4>
          <p className="text-sm text-gray-600">{details.privacyImpact}</p>
        </div>
        
        <div className="text-sm bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800 mb-4">
          You can change your consent settings at any time in your Privacy Settings.
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onDecline}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Decline
          </button>
          
          <button
            onClick={onProvideConsent}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Provide Consent
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentPrompt;