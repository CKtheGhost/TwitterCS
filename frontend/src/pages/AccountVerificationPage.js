import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

// Components
import TwitterVerification from '../components/verification/TwitterVerification';
import ConsentPrompt from '../components/privacy/ConsentPrompt';

const AccountVerificationPage = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consentType, setConsentType] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch verification status when component mounts
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${apiUrl}/verify/twitter/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setVerificationStatus(response.data.data);
      } catch (err) {
        console.error('Error fetching verification status:', err);
        
        // Check if this is a consent error
        if (err.response && err.response.status === 403 && err.response.data.needsConsent) {
          setNeedsConsent(true);
          setConsentType(err.response.data.consentType);
        } else {
          setError('Failed to load verification status. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [isAuthenticated, token, apiUrl]);

  // Start Twitter verification process
  const startTwitterVerification = async (twitterUsername) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${apiUrl}/verify/twitter/start`,
        { twitterUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.data;
    } catch (err) {
      console.error('Error starting verification:', err);
      
      // Check if this is a consent error
      if (err.response && err.response.status === 403 && err.response.data.needsConsent) {
        setNeedsConsent(true);
        setConsentType(err.response.data.consentType);
        return null;
      } else {
        setError(err.response?.data?.error || 'Failed to start verification process. Please try again.');
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Complete Twitter verification process
  const completeTwitterVerification = async (twitterUsername) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${apiUrl}/verify/twitter/verify`,
        { twitterUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update verification status
      setVerificationStatus({
        ...verificationStatus,
        verified: true,
        username: twitterUsername
      });

      return response.data;
    } catch (err) {
      console.error('Error completing verification:', err);
      
      // Check if this is a consent error
      if (err.response && err.response.status === 403 && err.response.data.needsConsent) {
        setNeedsConsent(true);
        setConsentType(err.response.data.consentType);
        return null;
      } else {
        setError(err.response?.data?.error || 'Failed to verify account. Please make sure you posted the verification code and try again.');
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Provide consent
  const handleProvideConsent = async () => {
    try {
      setLoading(true);
      
      // Update consent setting
      await axios.put(
        `${apiUrl}/consent/${consentType.split('.')[0]}/${consentType.split('.')[1]}`,
        { enabled: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset consent prompt
      setNeedsConsent(false);
      setConsentType(null);
      
      // Reload verification status
      const response = await axios.get(`${apiUrl}/verify/twitter/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVerificationStatus(response.data.data);
    } catch (err) {
      console.error('Error providing consent:', err);
      setError('Failed to update consent settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
          <p className="text-gray-600 mb-4">
            Please log in to verify your social media accounts.
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

  if (loading && !verificationStatus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
        
        {needsConsent && (
          <ConsentPrompt
            consentType={consentType}
            onProvideConsent={handleProvideConsent}
            onDecline={() => {
              setNeedsConsent(false);
              setConsentType(null);
            }}
          />
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <p className="text-gray-700 mb-4">
            Verify your social media accounts to participate in quests and earn rewards. 
            We use ethical verification methods that respect your privacy.
          </p>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 mb-6">
            <h3 className="font-semibold mb-1">Privacy Notice</h3>
            <p>
              Account verification only confirms you own the account without collecting your data. 
              We only store your verification status and username after explicit consent.
              You can revoke consent at any time in your Privacy Settings.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <TwitterVerification
            status={verificationStatus}
            onStartVerification={startTwitterVerification}
            onCompleteVerification={completeTwitterVerification}
            loading={loading}
          />
          
          {/* Placeholder for future verification methods */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-400 mb-2">More verification options coming soon</h3>
            <p className="text-sm text-gray-500">
              We're working on adding more verification options for different social platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountVerificationPage;