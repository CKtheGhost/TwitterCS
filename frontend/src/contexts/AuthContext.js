import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [consentStatus, setConsentStatus] = useState({
    initialized: false,
    needsReview: false,
    consentVersion: null
  });
  const { account, isConnected, connectWallet } = useWeb3();
  const navigate = useNavigate();
  
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Set auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const response = await axios.get(`${apiUrl}/auth/me`);
          
          // Extract user data and consent info
          if (response.data && response.data.data) {
            setUser(response.data.data);
            
            // Handle consent status
            if (response.data.consent) {
              setConsentStatus({
                initialized: response.data.consent.initialized,
                needsReview: response.data.consent.needsReview || false,
                consentVersion: response.data.consent.consentVersion
              });
              
              // Redirect to privacy settings if consent setup is needed
              if (!response.data.consent.initialized && window.location.pathname !== '/privacy-settings') {
                setTimeout(() => navigate('/privacy-settings'), 0);
              }
            }
            
            // If wallet is not connected but we have an Ethereum address
            if (!isConnected && response.data.data.walletAddress) {
              try {
                await connectWallet();
              } catch (error) {
                console.log('Wallet auto-connection failed. User can connect manually.');
              }
            }
          }
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, isConnected, connectWallet]);

  // Update user information if wallet account changes
  useEffect(() => {
    const updateUserWallet = async () => {
      if (user && account && user.walletAddress !== account) {
        try {
          await axios.put(`${apiUrl}/users/wallet`, { walletAddress: account });
          setUser({ ...user, walletAddress: account });
        } catch (error) {
          console.error('Error updating wallet address:', error);
        }
      }
    };

    if (isConnected && user) {
      updateUserWallet();
    }
  }, [account, isConnected, user]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, { email, password });
      const { token: newToken, user: userData, consent } = response.data;
      
      // Save token and set user
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Update consent status
      if (consent) {
        setConsentStatus({
          initialized: consent.initialized,
          needsReview: consent.needsReview || false,
          consentVersion: consent.consentVersion
        });
        
        // If consent setup is needed, redirect to privacy settings
        if (!consent.initialized) {
          // Use timeout to ensure navigation happens after state updates
          setTimeout(() => navigate('/privacy-settings'), 0);
        }
      }
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return {
        user: userData,
        consentStatus: consent
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const walletAddress = account || null;
      
      const response = await axios.post(`${apiUrl}/auth/register`, {
        username,
        email,
        password,
        walletAddress
      });
      
      const { token: newToken, user: userData, consent } = response.data;
      
      // Save token and set user
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Update consent status
      if (consent) {
        setConsentStatus({
          initialized: consent.initialized,
          needsReview: false, // New accounts don't need review
          consentVersion: consent.consentVersion
        });
        
        // Redirect to privacy settings to complete consent setup
        setTimeout(() => navigate('/privacy-settings'), 0);
      }
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return {
        user: userData,
        consentStatus: consent
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  // Function to check if user needs to complete consent setup
  const needsConsentSetup = () => {
    return user && (!consentStatus.initialized || consentStatus.needsReview);
  };
  
  // Function to update consent status
  const updateConsentStatus = (newStatus) => {
    setConsentStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        consentStatus,
        needsConsentSetup,
        updateConsentStatus,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};