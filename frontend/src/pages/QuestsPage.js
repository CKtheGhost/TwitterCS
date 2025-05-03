import React, { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import QuestList from '../components/QuestList';
import { useWeb3 } from '../hooks/useWeb3';

const QuestTypes = [
  { type: 0, name: 'Post', details: 'Create a new post on the platform' },
  { type: 1, name: 'Comment', details: 'Leave a meaningful comment on another user\'s post' },
  { type: 2, name: 'Like', details: 'Like content from other users' },
  { type: 3, name: 'Share', details: 'Share content with your network' },
  { type: 4, name: 'Follow', details: 'Follow another user on the platform' },
  { type: 5, name: 'Invite', details: 'Invite a new user to join the platform' }
];

const QuestsPage = () => {
  const { getCurrentSeason, getParticipantInfo, account, isConnected } = useWeb3();
  const [selectedQuestType, setSelectedQuestType] = useState(null);
  const [stats, setStats] = useState({
    totalCompletedQuests: 0,
    pointsEarned: 0,
    leaderboardPosition: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!isConnected || !account) return;
      
      try {
        // Get current season
        const season = await getCurrentSeason();
        if (!season) return;
        
        // Get participant info
        const info = await getParticipantInfo(season.id, account);
        if (!info) return;
        
        // For the demo, we'll set some simulated stats
        setStats({
          totalCompletedQuests: 47,
          pointsEarned: info.score,
          leaderboardPosition: 14 // This would be fetched from the leaderboard in a real app
        });
      } catch (err) {
        console.error('Error fetching quest stats:', err);
      }
    };
    
    fetchStats();
  }, [getCurrentSeason, getParticipantInfo, account, isConnected]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="mb-4 md:mb-0">Daily Quests</h1>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <QuestList />
          
          {selectedQuestType !== null && (
            <div className="mt-6 card">
              <h3 className="mb-4">{QuestTypes[selectedQuestType].name} Quest Details</h3>
              <p className="mb-4">{QuestTypes[selectedQuestType].details}</p>
              
              <div className="bg-primary-50 p-4 rounded-md border border-primary-100">
                <h4 className="font-semibold text-primary-700 mb-2">How to Complete</h4>
                <ol className="list-decimal pl-5 space-y-1 text-secondary-700">
                  <li>Go to the main feed or user profiles</li>
                  <li>Perform the required action: {QuestTypes[selectedQuestType].name.toLowerCase()}</li>
                  <li>Return to this page and click "Complete Quest"</li>
                  <li>Confirm the transaction in your wallet</li>
                </ol>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="card">
            <h3 className="mb-4">Your Quest Stats</h3>
            
            {isConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary-50 p-3 rounded-md text-center">
                    <div className="text-2xl font-semibold text-primary-600">{stats.totalCompletedQuests}</div>
                    <div className="text-xs text-secondary-500">Quests Completed</div>
                  </div>
                  <div className="bg-secondary-50 p-3 rounded-md text-center">
                    <div className="text-2xl font-semibold text-primary-600">{stats.pointsEarned}</div>
                    <div className="text-xs text-secondary-500">Points Earned</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary-700 mb-2">Leaderboard Position</h4>
                  <div className="text-2xl font-bold text-primary-600">#{stats.leaderboardPosition}</div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary-700 mb-2">Quest Types</h4>
                  <div className="space-y-2">
                    {QuestTypes.map(quest => (
                      <button
                        key={quest.type}
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedQuestType === quest.type
                            ? 'bg-primary-100 text-primary-800'
                            : 'hover:bg-secondary-50'
                        }`}
                        onClick={() => setSelectedQuestType(quest.type)}
                      >
                        {quest.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-secondary-600">Connect your wallet to view your quest stats.</p>
            )}
          </div>
          
          <div className="card mt-6">
            <h3 className="mb-4">Quest Tips</h3>
            <ul className="space-y-3 text-secondary-700">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Quests reset daily at 00:00 UTC.
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Suspicious activity may result in flagging and score penalties.
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Complete all available quests daily to maximize your score.
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Higher-value quests have lower daily limits.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;