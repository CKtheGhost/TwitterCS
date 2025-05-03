import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SocialTokenABI from '../utils/abis/SocialToken.json';
import ContentRegistryABI from '../utils/abis/ContentRegistry.json';
import EngagementABI from '../utils/abis/Engagement.json';
import SocialEngagementCompetitionABI from '../utils/abis/SocialEngagementCompetition.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [contracts, setContracts] = useState({
    socialToken: null,
    contentRegistry: null,
    engagement: null,
    competition: null
  });

  // Contract addresses (would be set based on deployment)
  const contractAddresses = {
    socialToken: process.env.REACT_APP_SOCIAL_TOKEN_ADDRESS,
    contentRegistry: process.env.REACT_APP_CONTENT_REGISTRY_ADDRESS,
    engagement: process.env.REACT_APP_ENGAGEMENT_ADDRESS,
    competition: process.env.REACT_APP_COMPETITION_ADDRESS || '0x123456789abcdef123456789abcdef123456789a' // Replace with actual address
  };

  // Initialize provider and check if wallet is connected
  useEffect(() => {
    const initializeProvider = async () => {
      // Check if window.ethereum is available
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);

          // Get network information
          const network = await web3Provider.getNetwork();
          setChainId(network.chainId);
          // Set network name based on chain ID
          if (network.chainId === 1n) {
            setNetworkName('Ethereum Mainnet');
          } else if (network.chainId === 5n) {
            setNetworkName('Goerli Testnet');
          } else if (network.chainId === 11155111n) {
            setNetworkName('Sepolia Testnet');
          } else {
            setNetworkName(`Chain ID: ${network.chainId.toString()}`);
          }

          // Check for existing accounts
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setSigner(await web3Provider.getSigner());
            setIsConnected(true);
          }

          // Initialize contract instances
          initializeContracts(web3Provider);

          // Setup event listeners
          setupEventListeners();
        } catch (error) {
          console.error('Error initializing web3:', error);
        }
      } else {
        console.log('No Ethereum browser extension detected');
      }
    };

    initializeProvider();

    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('disconnect');
      }
    };
  }, [setupEventListeners, initializeContracts]);

  // Initialize contract instances
  const initializeContracts = React.useCallback(async (web3Provider) => {
    try {
      // Initialize competition contract
      if (contractAddresses.competition) {
        const competitionContract = new ethers.Contract(
          contractAddresses.competition,
          SocialEngagementCompetitionABI,
          web3Provider
        );
        
        // Get signer for write operations
        const signerOrProvider = signer || web3Provider;
        const competitionWithSigner = competitionContract.connect(signerOrProvider);
        
        // Initialize other contracts if available
        let socialTokenContract = null;
        let contentRegistryContract = null;
        let engagementContract = null;
        
        if (contractAddresses.socialToken) {
          socialTokenContract = new ethers.Contract(
            contractAddresses.socialToken,
            SocialTokenABI,
            web3Provider
          );
        }
        
        if (contractAddresses.contentRegistry) {
          contentRegistryContract = new ethers.Contract(
            contractAddresses.contentRegistry,
            ContentRegistryABI,
            web3Provider
          );
        }
        
        if (contractAddresses.engagement) {
          engagementContract = new ethers.Contract(
            contractAddresses.engagement,
            EngagementABI,
            web3Provider
          );
        }

        setContracts({
          socialToken: socialTokenContract,
          contentRegistry: contentRegistryContract,
          engagement: engagementContract,
          competition: competitionWithSigner
        });
      }
    } catch (error) {
      console.error('Error initializing contracts:', error);
      setConnectionError('Failed to initialize contracts');
    }
  }, [contractAddresses, signer]);

  // Setup event listeners for account, chain, and disconnect events
  const setupEventListeners = React.useCallback(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Will call updateSignerAndContracts via useEffect
        } else {
          setAccount(null);
          setSigner(null);
          setIsConnected(false);
        }
      });

      // Handle chain changes
      window.ethereum.on('chainChanged', (chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
        // Will call updateSignerAndContracts via useEffect
      });

      // Handle disconnect
      window.ethereum.on('disconnect', () => {
        setAccount(null);
        setSigner(null);
        setIsConnected(false);
      });
    }
  }, []);

  // Update signer and reconnect contracts after account or chain changes
  const updateSignerAndContracts = async () => {
    if (provider) {
      try {
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
        setIsConnected(true);
        initializeContracts(provider);
      } catch (error) {
        console.error('Error updating signer:', error);
      }
    }
  };
  
  // Effect to update signer and contracts when account or chainId changes
  useEffect(() => {
    if (account && chainId && provider) {
      updateSignerAndContracts();
    }
  }, [account, chainId, provider, initializeContracts]);

  // Connect wallet function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
          setIsConnected(true);
          return accounts[0];
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      }
    } else {
      console.log('No Ethereum browser extension detected');
      throw new Error('No Ethereum browser extension detected');
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Utility functions for competition contract
  const getCurrentSeason = async () => {
    try {
      if (!contracts.competition) return null;
      
      const currentSeasonId = await contracts.competition.currentSeasonId();
      if (currentSeasonId <= 0) return null;
      
      const seasonData = await contracts.competition.seasons(currentSeasonId);
      return {
        id: seasonData.id.toString(),
        startTime: new Date(seasonData.startTime * 1000),
        endTime: new Date(seasonData.endTime * 1000),
        prizePool: ethers.formatEther(seasonData.prizePool),
        participantCount: seasonData.participantCount.toString(),
        state: seasonData.state, // 0: Registration, 1: Active, 2: Finished, 3: Distributed
        prizesDistributed: seasonData.prizesDistributed
      };
    } catch (error) {
      console.error('Error getting current season:', error);
      return null;
    }
  };

  const getParticipantInfo = async (seasonId, participant) => {
    try {
      if (!contracts.competition) return null;
      
      const participantAddress = participant || account;
      if (!participantAddress) return null;
      
      const info = await contracts.competition.getParticipantInfo(seasonId, participantAddress);
      return {
        address: info.userAddress,
        score: info.score.toString(),
        joinedTimestamp: new Date(info.joinedTimestamp * 1000),
        lastQuestTimestamp: new Date(info.lastQuestTimestamp * 1000),
        questsCompletedToday: info.questsCompletedToday.toString(),
        status: info.status, // 0: Active, 1: Flagged, 2: Suspended, 3: Banned
        hasClaimed: info.hasClaimed
      };
    } catch (error) {
      console.error('Error getting participant info:', error);
      return null;
    }
  };

  const getLeaderboard = async (seasonId) => {
    try {
      if (!contracts.competition) return [];
      
      const rankings = await contracts.competition.seasonRankings(seasonId);
      if (!rankings || rankings.length === 0) {
        // If rankings are not calculated yet, get all participants and sort by score
        const participants = await contracts.competition.getSeasonParticipants(seasonId);
        
        const leaderboardData = await Promise.all(
          participants.map(async (address) => {
            const score = await contracts.competition.getParticipantScore(seasonId, address);
            return { address, score: score.toString() };
          })
        );
        
        // Sort by score (descending)
        return leaderboardData.sort((a, b) => Number(b.score) - Number(a.score));
      }
      
      // Rankings are already calculated
      return rankings.map((address, index) => ({
        position: index + 1,
        address
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  };

  const joinSeason = async () => {
    try {
      if (!contracts.competition || !signer) throw new Error('Contract or signer not available');
      
      const entryFee = await contracts.competition.ENTRY_FEE();
      const tx = await contracts.competition.joinSeason({ value: entryFee });
      await tx.wait();
      
      return { success: true, message: 'Successfully joined season' };
    } catch (error) {
      console.error('Error joining season:', error);
      return { success: false, message: error.message || 'Failed to join season' };
    }
  };

  const claimPrize = async (seasonId) => {
    try {
      if (!contracts.competition || !signer) throw new Error('Contract or signer not available');
      
      const tx = await contracts.competition.claimPrize(seasonId);
      await tx.wait();
      
      return { success: true, message: 'Successfully claimed prize' };
    } catch (error) {
      console.error('Error claiming prize:', error);
      return { success: false, message: error.message || 'Failed to claim prize' };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        networkName,
        isConnected,
        connectionError,
        contracts,
        connectWallet,
        disconnectWallet,
        // Competition specific functions
        getCurrentSeason,
        getParticipantInfo,
        getLeaderboard,
        joinSeason,
        claimPrize
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};