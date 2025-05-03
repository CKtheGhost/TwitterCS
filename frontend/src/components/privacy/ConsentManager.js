import React, { useState } from 'react';

const ConsentManager = ({ consentSettings, onUpdateConsent }) => {
  const [expandedSections, setExpandedSections] = useState({
    socialVerification: true,
    dataUsage: true,
    communications: false,
    marketing: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Formats consent category names for display
  const formatCategoryName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };

  // Handle toggle change
  const handleToggleChange = (category, subcategory) => {
    const currentValue = getConsentValue(category, subcategory);
    onUpdateConsent(category, subcategory, !currentValue);
  };

  // Get current consent value
  const getConsentValue = (category, subcategory, field = 'enabled') => {
    if (
      consentSettings &&
      consentSettings[category] &&
      consentSettings[category][subcategory]
    ) {
      return field === 'enabled'
        ? consentSettings[category][subcategory].enabled
        : consentSettings[category][subcategory][field];
    }
    return false;
  };

  // Get last updated date
  const getLastUpdated = (category, subcategory) => {
    const lastUpdated = getConsentValue(category, subcategory, 'lastUpdated');
    if (lastUpdated) {
      return new Date(lastUpdated).toLocaleDateString();
    }
    return 'Never';
  };

  // Process each consent category
  const renderConsentCategories = () => {
    if (!consentSettings) return null;

    return Object.keys(consentSettings)
      .filter(key => typeof consentSettings[key] === 'object' && key !== 'user' && key !== '_id' && key !== '__v' && key !== 'consentHistory')
      .map((category) => (
        <div key={category} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection(category)}
          >
            <h3 className="text-lg font-medium text-gray-900">
              {formatCategoryName(category)}
            </h3>
            <span className="text-gray-500">
              {expandedSections[category] ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </div>

          {expandedSections[category] && (
            <div className="px-4 py-5 divide-y divide-gray-200">
              {Object.keys(consentSettings[category]).map((subcategory) => (
                <div key={`${category}-${subcategory}`} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">
                        {formatCategoryName(subcategory)}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {getConsentDescription(category, subcategory)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Last updated: {getLastUpdated(category, subcategory)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={getConsentValue(category, subcategory)}
                          onChange={() => handleToggleChange(category, subcategory)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ));
  };

  // Helper function to return descriptive text for each consent type
  const getConsentDescription = (category, subcategory) => {
    const descriptions = {
      socialVerification: {
        twitter: 'Allow verification of your Twitter account to participate in quests and earn rewards. We will only verify account ownership without storing your tweets or other data.'
      },
      dataUsage: {
        engagementMetrics: 'Allow collection of public engagement metrics (likes, shares, etc.) when verifying quest completion. This data is only used to verify your quest activity.',
        publicProfile: 'Allow access to your public profile information from connected social accounts. This is used for verification purposes only.',
        onChainActivity: 'Allow monitoring of your on-chain activity related to the platform. This helps track rewards and quest completion.'
      },
      communications: {
        email: 'Receive important updates and notifications via email. You can choose the frequency of communications.',
        platform: 'Receive in-platform notifications about quests, rewards, and other updates.'
      },
      marketing: {
        analytics: 'Allow anonymous usage data collection to help us improve the platform. No personally identifiable information is included.',
        thirdParty: 'Allow sharing of your data with trusted third parties for marketing purposes.'
      }
    };

    return descriptions[category]?.[subcategory] || 'No description available.';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Privacy & Consent Settings</h2>
        <p className="mt-2 text-gray-600">
          Control how your data is collected and used. Your privacy is important to us - you can change these settings at any time.
        </p>
      </div>

      {renderConsentCategories()}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900">Privacy By Design</h3>
        <p className="mt-2 text-sm text-blue-700">
          Our platform respects your privacy choices. We only collect data you explicitly consent to, and you can withdraw consent at any time.
          For more information, please read our <a href="/privacy" className="text-blue-900 underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default ConsentManager;