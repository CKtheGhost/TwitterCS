import React from 'react';

const ConsentHistory = ({ consentHistory }) => {
  // Parse and format the timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  // Format the change type for display
  const formatChangeType = (type) => {
    switch (type.toLowerCase()) {
      case 'grant':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Granted
          </span>
        );
      case 'revoke':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Revoked
          </span>
        );
      case 'update':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Updated
          </span>
        );
      case 'export':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            Data Export
          </span>
        );
      case 'delete':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Data Deletion
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  // Format consent category for display
  const formatCategory = (category) => {
    if (!category) return 'General';
    
    return category
      .split('.')
      .map(part => 
        part.replace(/([A-Z])/g, ' $1') // Add space before capital letters
           .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      )
      .join(' › ');
  };

  // Get the device name from user agent
  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown device';
    
    let device = 'Unknown';
    
    if (userAgent.includes('Windows')) {
      device = 'Windows';
    } else if (userAgent.includes('Mac')) {
      device = 'Mac';
    } else if (userAgent.includes('iPhone')) {
      device = 'iPhone';
    } else if (userAgent.includes('iPad')) {
      device = 'iPad';
    } else if (userAgent.includes('Android')) {
      device = 'Android';
    } else if (userAgent.includes('Linux')) {
      device = 'Linux';
    }
    
    // Add browser info
    if (userAgent.includes('Chrome')) {
      device += ' - Chrome';
    } else if (userAgent.includes('Firefox')) {
      device += ' - Firefox';
    } else if (userAgent.includes('Safari')) {
      device += ' - Safari';
    } else if (userAgent.includes('Edge')) {
      device += ' - Edge';
    }
    
    return device;
  };

  if (!consentHistory || consentHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No consent history</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your consent change history will appear here when you update your privacy settings.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Consent History</h2>
        <p className="mt-2 text-gray-600">
          View a complete history of changes to your consent settings. This helps you keep track of how and when your privacy preferences were updated.
        </p>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date & Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Change
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Device
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consentHistory.map((entry, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(entry.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatChangeType(entry.changeType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCategory(entry.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getDeviceInfo(entry.requestInfo?.userAgent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-medium text-yellow-900">Why We Keep This History</h3>
        <p className="mt-2 text-sm text-yellow-700">
          We maintain a detailed history of consent changes to ensure transparency and compliance with data protection laws. 
          This record protects both your rights and helps us demonstrate compliance with GDPR and similar regulations.
        </p>
      </div>
    </div>
  );
};

export default ConsentHistory;