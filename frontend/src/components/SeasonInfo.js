import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const SeasonInfo = () => {
  const { getCurrentSeason, getParticipantInfo, joinSeason, account, isConnected } = useWeb3();
  const [season, setSeason] = useState(null);
  const [participantInfo, setParticipantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get current season
        const currentSeason = await getCurrentSeason();
        setSeason(currentSeason);
        
        // If we have a season and the user is connected, get their participation info
        if (currentSeason && isConnected && account) {
          const info = await getParticipantInfo(currentSeason.id, account);
          setParticipantInfo(info);
        } else {
          setParticipantInfo(null);
        }
      } catch (err) {
        console.error('Error fetching season data:', err);
        setError('Failed to load season information');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonData();
    
    // Set up an interval to refresh data every 60 seconds
    const interval = setInterval(fetchSeasonData, 60000);
    
    return () => clearInterval(interval);
  }, [getCurrentSeason, getParticipantInfo, account, isConnected]);

  const handleJoinSeason = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setJoining(true);
      setError('');
      
      const result = await joinSeason();
      
      if (result.success) {
        // Refresh the participant info
        if (season) {
          const info = await getParticipantInfo(season.id, account);
          setParticipantInfo(info);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error joining season:', err);
      setError('Failed to join season');
    } finally {
      setJoining(false);
    }
  };

  const getSeasonStateLabel = (state) => {
    switch (state) {
      case 0: return 'Registration';
      case 1: return 'Active';
      case 2: return 'Finished';
      case 3: return 'Distributed';
      default: return 'Unknown';
    }
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 0: return 'badge-success';
      case 1: return 'badge-warning';
      case 2: return 'badge-danger';
      case 3: return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  const getTimeRemaining = () => {
    if (!season) return null;
    
    const now = new Date();
    const endTime = new Date(season.endTime);
    
    if (now > endTime) return 'Season ended';
    
    const diff = endTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-secondary-200 mb-4 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
          <div className="h-4 bg-secondary-200 rounded"></div>
          <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="card">
        <h3 className="mb-4">Current Season</h3>
        <p className="text-secondary-600">No active season at the moment.</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3>Season #{season.id}</h3>
        <div className={`badge ${season.state === 1 ? 'badge-success' : 'badge-primary'}`}>
          {getSeasonStateLabel(season.state)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-secondary-500 mb-1">Start Time</div>
          <div>{season.startTime.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-secondary-500 mb-1">End Time</div>
          <div>{season.endTime.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-secondary-500 mb-1">Prize Pool</div>
          <div className="text-primary-600 font-semibold">{season.prizePool} ETH</div>
        </div>
        <div>
          <div className="text-sm text-secondary-500 mb-1">Time Remaining</div>
          <div className="font-mono">{getTimeRemaining()}</div>
        </div>
      </div>

      <div className="border-t border-secondary-200 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold">Participants</h4>
          <div className="text-secondary-600">{season.participantCount} total</div>
        </div>

        {participantInfo ? (
          <div className="bg-secondary-50 p-3 rounded-md">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-secondary-500">Your Score</div>
              <div className="font-semibold text-primary-600">{participantInfo.score} points</div>
            </div>
            <div className="flex justify-between">
              <div className="text-sm text-secondary-500">Status</div>
              <div className={getStatusBadgeClass(participantInfo.status)}>
                {getParticipantStatusLabel(participantInfo.status)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-secondary-600 mb-3">You haven't joined this season yet</p>
            <button 
              className="btn-primary"
              disabled={joining || !isConnected || season.state !== 0}
              onClick={handleJoinSeason}
            >
              {joining ? 'Joining...' : 'Join Season (0.1 ETH)'}
            </button>
            {!isConnected && <p className="text-sm text-secondary-500 mt-2">Connect your wallet to join</p>}
            {season.state !== 0 && <p className="text-sm text-secondary-500 mt-2">Registration is closed</p>}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default SeasonInfo;