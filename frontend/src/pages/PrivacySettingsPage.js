import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

// Components
import ConsentManager from '../components/privacy/ConsentManager';
import DataExportRequest from '../components/privacy/DataExportRequest';
import DataDeletionRequest from '../components/privacy/DataDeletionRequest';
import ConsentHistory from '../components/privacy/ConsentHistory';

const PrivacySettingsPage = () => {
  const { isAuthenticated, token } = useAuth();
  const [consentSettings, setConsentSettings] = useState(null);
  const [consentHistory, setConsentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consent');
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchConsentSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        // Fetch user's current consent settings
        const response = await axios.get(`${apiUrl}/consent`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setConsentSettings(response.data);

        // Fetch consent history
        const historyResponse = await axios.get(`${apiUrl}/consent/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setConsentHistory(historyResponse.data);
      } catch (err) {
        console.error('Error fetching consent settings:', err);
        setError('Failed to load privacy settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsentSettings();
  }, [isAuthenticated, token, apiUrl]);

  const handleUpdateConsent = async (category, subcategory, enabled) => {
    try {
      setError(null);
      setUpdateSuccess(false);

      const response = await axios.put(
        `${apiUrl}/consent/${category}/${subcategory}`,
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state with new settings
      setConsentSettings(response.data);
      setUpdateSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

      // Refresh consent history
      const historyResponse = await axios.get(`${apiUrl}/consent/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsentHistory(historyResponse.data);
    } catch (err) {
      console.error('Error updating consent setting:', err);
      setError('Failed to update privacy setting. Please try again.');
    }
  };

  const handleRequestDataExport = async () => {
    try {
      setError(null);
      await axios.post(
        `${apiUrl}/consent/export`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success message
      alert('Data export request submitted successfully. You will receive an email with your data shortly.');
    } catch (err) {
      console.error('Error requesting data export:', err);
      setError('Failed to request data export. Please try again.');
    }
  };

  const handleRequestDataDeletion = async () => {
    try {
      setError(null);
      await axios.post(
        `${apiUrl}/consent/delete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success message
      alert('Data deletion request submitted successfully. Your account will be scheduled for deletion.');
    } catch (err) {
      console.error('Error requesting data deletion:', err);
      setError('Failed to request data deletion. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Privacy Settings</h2>
          <p className="text-gray-600 mb-4">
            Please log in to manage your privacy settings and consent preferences.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/login'}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('consent')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm leading-5 focus:outline-none ${
                activeTab === 'consent'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Consent Management
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm leading-5 focus:outline-none ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Consent History
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm leading-5 focus:outline-none ${
                activeTab === 'data'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Data Requests
            </button>
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {updateSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Privacy settings updated successfully.
            </div>
          )}

          {activeTab === 'consent' && consentSettings && (
            <ConsentManager
              consentSettings={consentSettings}
              onUpdateConsent={handleUpdateConsent}
            />
          )}

          {activeTab === 'history' && (
            <ConsentHistory consentHistory={consentHistory} />
          )}

          {activeTab === 'data' && (
            <div className="space-y-8">
              <DataExportRequest onRequestExport={handleRequestDataExport} />
              <DataDeletionRequest onRequestDeletion={handleRequestDataDeletion} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;