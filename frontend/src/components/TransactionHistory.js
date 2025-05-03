import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';

const TransactionHistory = () => {
  const { account, provider, contracts, isConnected } = useWeb3();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !account || !provider || !contracts.competition) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Get current block number
        const currentBlock = await provider.getBlockNumber();
        
        // We'll look back 10000 blocks (roughly 1-2 days on Ethereum)
        const fromBlock = Math.max(0, currentBlock - 10000);
        
        // Get events related to the user
        const joinedEvents = await contracts.competition.queryFilter(
          contracts.competition.filters.ParticipantJoined(null, account),
          fromBlock
        );
        
        const questEvents = await contracts.competition.queryFilter(
          contracts.competition.filters.QuestCompleted(null, account),
          fromBlock
        );
        
        const prizeEvents = await contracts.competition.queryFilter(
          contracts.competition.filters.PrizesClaimed(null, account),
          fromBlock
        );
        
        const statusEvents = await contracts.competition.queryFilter(
          contracts.competition.filters.ParticipantStatusChanged(null, account),
          fromBlock
        );
        
        // Combine and format all events
        const allEvents = [
          ...joinedEvents.map(event => ({
            type: 'join',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            seasonId: event.args.seasonId.toString(),
            amount: ethers.formatEther(event.args.entryFee)
          })),
          ...questEvents.map(event => ({
            type: 'quest',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            seasonId: event.args.seasonId.toString(),
            questType: event.args.questType,
            points: event.args.pointsEarned.toString()
          })),
          ...prizeEvents.map(event => ({
            type: 'prize',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            seasonId: event.args.seasonId.toString(),
            amount: ethers.formatEther(event.args.amount),
            position: event.args.position.toString()
          })),
          ...statusEvents.map(event => ({
            type: 'status',
            hash: event.transactionHash,
            blockNumber: event.blockNumber,
            seasonId: event.args.seasonId.toString(),
            newStatus: event.args.newStatus
          }))
        ];
        
        // Sort by block number (descending)
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        
        // Get block timestamps for each transaction
        const txsWithTimestamps = await Promise.all(
          allEvents.map(async (tx) => {
            try {
              const block = await provider.getBlock(tx.blockNumber);
              return {
                ...tx,
                timestamp: block ? new Date(block.timestamp * 1000) : null
              };
            } catch (err) {
              console.error(`Error getting block for ${tx.hash}:`, err);
              return {
                ...tx,
                timestamp: null
              };
            }
          })
        );
        
        setTransactions(txsWithTimestamps);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [account, provider, contracts.competition, isConnected]);

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'join': return 'Joined Season';
      case 'quest': return 'Completed Quest';
      case 'prize': return 'Claimed Prize';
      case 'status': return 'Status Changed';
      default: return 'Transaction';
    }
  };

  const getQuestTypeLabel = (questType) => {
    switch (Number(questType)) {
      case 0: return 'Post';
      case 1: return 'Comment';
      case 2: return 'Like';
      case 3: return 'Share';
      case 4: return 'Follow';
      case 5: return 'Invite';
      default: return 'Unknown';
    }
  };

  const getStatusLabel = (status) => {
    switch (Number(status)) {
      case 0: return 'Active';
      case 1: return 'Flagged';
      case 2: return 'Suspended';
      case 3: return 'Banned';
      default: return 'Unknown';
    }
  };

  const getTransactionDetails = (tx) => {
    switch (tx.type) {
      case 'join':
        return `Paid ${tx.amount} ETH to join Season #${tx.seasonId}`;
      case 'quest':
        return `Earned ${tx.points} points for completing ${getQuestTypeLabel(tx.questType)} quest in Season #${tx.seasonId}`;
      case 'prize':
        return `Received ${tx.amount} ETH prize for position #${tx.position} in Season #${tx.seasonId}`;
      case 'status':
        return `Status changed to ${getStatusLabel(tx.newStatus)} in Season #${tx.seasonId}`;
      default:
        return '';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'join':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'quest':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'prize':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 1.5c-1.921 0-3.816.111-5.68.327-1.497.174-2.57 1.46-2.57 2.93V21.75a.75.75 0 001.029.696l3.471-1.388 3.472 1.388a.75.75 0 00.556 0l3.472-1.388 3.471 1.388a.75.75 0 001.029-.696V4.757c0-1.47-1.073-2.756-2.57-2.93A49.255 49.255 0 0012 1.5zm3.53 7.28a.75.75 0 00-1.06-1.06l-6 6a.75.75 0 101.06 1.06l6-6zM8.625 9a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm5.625 3.375a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'status':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 1.5c-1.921 0-3.816.111-5.68.327-1.497.174-2.57 1.46-2.57 2.93V21.75a.75.75 0 001.029.696l3.471-1.388 3.472 1.388a.75.75 0 00.556 0l3.472-1.388 3.471 1.388a.75.75 0 001.029-.696V4.757c0-1.47-1.073-2.756-2.57-2.93A49.255 49.255 0 0012 1.5zm3.53 7.28a.75.75 0 00-1.06-1.06l-6 6a.75.75 0 101.06 1.06l6-6zM8.625 9a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm5.625 3.375a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" />
            </svg>
          </div>
        );
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="mb-4">Transaction History</h3>
        <p className="text-secondary-600">Connect your wallet to view your transaction history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-secondary-200 mb-4 rounded"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="mb-4">Transaction History</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4">Transaction History</h3>
        <p className="text-secondary-600">No transactions found for your address in recent blocks.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-6">Transaction History</h3>
      
      <div className="space-y-6">
        {transactions.map((tx) => (
          <div key={tx.hash} className="flex items-start">
            {getTransactionIcon(tx.type)}
            
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h4 className="font-semibold">{getTransactionTypeLabel(tx.type)}</h4>
                {tx.timestamp && (
                  <div className="text-sm text-secondary-500">
                    {tx.timestamp.toLocaleString()}
                  </div>
                )}
              </div>
              
              <p className="text-secondary-600 mt-1">
                {getTransactionDetails(tx)}
              </p>
              
              <a 
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center mt-2"
              >
                View on Etherscan
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-secondary-500 italic">
        Showing transactions from the last 10,000 blocks (approximately 1-2 days)
      </div>
    </div>
  );
};

export default TransactionHistory;