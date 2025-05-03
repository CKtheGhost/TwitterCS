import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ParticipantStats = () => {
  const { account, isConnected, getCurrentSeason, getParticipantInfo } = useWeb3();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Get current season
        const currentSeason = await getCurrentSeason();
        if (!currentSeason) {
          setLoading(false);
          return;
        }
        
        // Get participant info
        const info = await getParticipantInfo(currentSeason.id, account);
        if (!info) {
          setLoading(false);
          return;
        }
        
        // For the demo, we'll create some simulated stats
        // In a real application, these would come from the blockchain or API
        setStats({
          questsCompleted: {
            Post: 12,
            Comment: 45,
            Like: 87,
            Share: 23,
            Follow: 14,
            Invite: 5
          },
          totalScore: info.score,
          rank: 14, // Would be calculated based on leaderboard
          joinedOn: info.joinedTimestamp,
          status: info.status
        });
      } catch (err) {
        console.error('Error fetching participant stats:', err);
        setError('Failed to load your statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [account, isConnected, getCurrentSeason, getParticipantInfo]);

  const getParticipantStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Flagged';
      case 2: return 'Suspended';
      case 3: return 'Banned';
      default: return 'Unknown';
    }
  };

  const chartData = stats ? {
    labels: Object.keys(stats.questsCompleted),
    datasets: [
      {
        data: Object.values(stats.questsCompleted),
        backgroundColor: [
          '#4f46e5', // primary-600
          '#818cf8', // primary-400
          '#c7d2fe', // primary-200
          '#475569', // secondary-600
          '#94a3b8', // secondary-400
          '#e2e8f0', // secondary-200
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
    },
    maintainAspectRatio: false,
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="mb-4">Your Statistics</h3>
        <p className="text-secondary-600">Connect your wallet to view your stats.</p>
      </div>
    );
  }

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

  if (!stats) {
    return (
      <div className="card">
        <h3 className="mb-4">Your Statistics</h3>
        <p className="text-secondary-600">You haven't joined the current season yet.</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-6">Your Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary-50 p-4 rounded-md text-center">
          <div className="text-3xl font-semibold text-primary-600">{stats.totalScore}</div>
          <div className="text-sm text-secondary-500">Total Score</div>
        </div>
        <div className="bg-secondary-50 p-4 rounded-md text-center">
          <div className="text-3xl font-semibold text-primary-600">#{stats.rank}</div>
          <div className="text-sm text-secondary-500">Current Rank</div>
        </div>
        <div className="bg-secondary-50 p-4 rounded-md text-center">
          <div className="text-3xl font-semibold text-primary-600">
            {getParticipantStatusLabel(stats.status)}
          </div>
          <div className="text-sm text-secondary-500">Status</div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Quests Completed</h4>
        <div className="h-64">
          {chartData && <Doughnut data={chartData} options={chartOptions} />}
        </div>
      </div>
      
      <div className="text-sm text-secondary-500">
        Joined on {stats.joinedOn.toLocaleDateString()}
      </div>
      
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default ParticipantStats;