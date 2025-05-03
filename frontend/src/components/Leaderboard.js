import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const Leaderboard = () => {
  const { getCurrentSeason, getLeaderboard, getParticipantInfo, account } = useWeb3();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get current season
        const season = await getCurrentSeason();
        if (!season) {
          setError('No active season found');
          setLoading(false);
          return;
        }
        
        setCurrentSeason(season);
        
        // Get leaderboard data
        const leaderboardData = await getLeaderboard(season.id);
        
        // Enhance leaderboard data with additional info
        const enhancedLeaderboard = await Promise.all(
          leaderboardData.map(async (entry, index) => {
            try {
              const participantInfo = await getParticipantInfo(season.id, entry.address);
              
              return {
                position: entry.position || index + 1,
                address: entry.address,
                score: entry.score || (participantInfo ? participantInfo.score : '0'),
                isCurrentUser: entry.address.toLowerCase() === (account || '').toLowerCase(),
                status: participantInfo ? participantInfo.status : 0
              };
            } catch (err) {
              console.error(`Error getting info for ${entry.address}:`, err);
              return {
                position: entry.position || index + 1,
                address: entry.address,
                score: entry.score || '0',
                isCurrentUser: entry.address.toLowerCase() === (account || '').toLowerCase(),
                status: 0
              };
            }
          })
        );
        
        setLeaderboard(enhancedLeaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Set up refresh interval (every 2 minutes)
    const interval = setInterval(fetchLeaderboard, 120000);
    
    return () => clearInterval(interval);
  }, [getCurrentSeason, getLeaderboard, getParticipantInfo, account]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getParticipantStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Flagged';
      case 2: return 'Suspended';
      case 3: return 'Banned';
      default: return 'Unknown';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 0: return '';
      case 1: return 'text-yellow-600';
      case 2: return 'text-red-600 line-through';
      case 3: return 'text-red-600 line-through';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-secondary-200 mb-4 rounded"></div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 bg-secondary-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="mb-4">Leaderboard</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4">Leaderboard</h3>
        <p className="text-secondary-600">No participants yet in this season.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-6">Leaderboard - Season #{currentSeason?.id}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary-200">
              <th className="pb-2 text-left font-semibold text-secondary-600">Rank</th>
              <th className="pb-2 text-left font-semibold text-secondary-600">Participant</th>
              <th className="pb-2 text-right font-semibold text-secondary-600">Score</th>
              <th className="pb-2 text-right font-semibold text-secondary-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((participant) => (
              <tr 
                key={participant.address}
                className={`border-b border-secondary-100 ${
                  participant.isCurrentUser ? 'bg-primary-50' : ''
                }`}
              >
                <td className="py-3 font-medium">
                  {participant.position <= 3 ? (
                    <span className={
                      participant.position === 1 ? 'text-yellow-500' :
                      participant.position === 2 ? 'text-secondary-400' :
                      'text-amber-600'
                    }>
                      #{participant.position}
                    </span>
                  ) : (
                    `#${participant.position}`
                  )}
                </td>
                <td className={`py-3 ${getStatusClass(participant.status)}`}>
                  {formatAddress(participant.address)}
                  {participant.isCurrentUser && (
                    <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </td>
                <td className={`py-3 text-right font-mono ${getStatusClass(participant.status)}`}>
                  {participant.score}
                </td>
                <td className="py-3 text-right">
                  {participant.status > 0 && (
                    <span className={`text-xs ${
                      participant.status === 1 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {getParticipantStatusLabel(participant.status)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-secondary-500 italic">
        Leaderboard updates automatically every 2 minutes
      </div>
    </div>
  );
};

export default Leaderboard;