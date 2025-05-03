import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import questService from '../services/questService';
import ErrorDisplay from './ErrorDisplay';

const QUEST_TYPES = {
  0: {
    name: 'Post',
    description: 'Create a new post',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
      </svg>
    )
  },
  1: {
    name: 'Comment',
    description: 'Leave a comment on a post',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
      </svg>
    )
  },
  2: {
    name: 'Like',
    description: 'Like a post',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
      </svg>
    )
  },
  3: {
    name: 'Share',
    description: 'Share a post',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
      </svg>
    )
  },
  4: {
    name: 'Follow',
    description: 'Follow another user',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
      </svg>
    )
  },
  5: {
    name: 'Invite',
    description: 'Invite a new user',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
        <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
      </svg>
    )
  }
};

const QuestList = () => {
  const { contracts, isConnected, account, getCurrentSeason, getParticipantInfo } = useWeb3();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSeasonId, setCurrentSeasonId] = useState(null);
  const [participantInfo, setParticipantInfo] = useState(null);

  // Function to fetch quests with error handling
  const fetchQuests = async () => {
    if (!isConnected || !contracts.competition) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current season
      const season = await getCurrentSeason();
      if (!season || season.state !== 1) { // Only show quests for active seasons
        setLoading(false);
        return;
      }
      
      setCurrentSeasonId(season.id);
      
      // Get participant info to check daily limits
      if (account) {
        try {
          const info = await getParticipantInfo(season.id, account);
          setParticipantInfo(info);
        } catch (participantError) {
          console.error('Error getting participant info:', participantError);
          // Continue without participant info - will use fallback limits
        }
      }
      
      // In a real app, we would use our API service
      // const response = await questService.getAvailableQuests({ season: season.id });
      // if (response.success) {
      //   setQuests(response.data.data);
      // }
      
      // For this demo, we'll keep using the contract directly
      const questsData = [];
      
      for (let i = 0; i <= 5; i++) {
        try {
          const questData = await contracts.competition.quests(i);
          
          if (questData) {
            questsData.push({
              type: i,
              name: QUEST_TYPES[i].name,
              description: QUEST_TYPES[i].description,
              icon: QUEST_TYPES[i].icon,
              pointsValue: questData.pointsValue.toString(),
              dailyLimit: questData.dailyLimit.toString(),
              isActive: questData.isActive
            });
          }
        } catch (err) {
          console.error(`Error fetching quest type ${i}:`, err);
          // Continue with other quests instead of failing completely
        }
      }
      
      setQuests(questsData.filter(q => q.isActive));
    } catch (err) {
      console.error('Error fetching quests:', err);
      setError({
        message: 'Failed to load quests',
        code: err.code || 'UNKNOWN_ERROR',
        retryable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [contracts.competition, isConnected, account, getCurrentSeason, getParticipantInfo]);
  
  // Quest completion state with error handling
  const [completionState, setCompletionState] = useState({});
  
  const handleCompleteQuest = async (questType) => {
    // Mark this quest as in progress
    setCompletionState(prev => ({
      ...prev,
      [questType]: {
        isCompleting: true,
        isCompleted: false,
        error: null
      }
    }));
    
    try {
      // In a real app, we would use our API service:
      // const response = await questService.completeQuest(questId, { 
      //   type: questType,
      //   proof: {} // Any proof data needed
      // });
      
      // For the demo, we'll simulate the API call with success/failure scenarios
      const simulateApiCall = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Randomly succeed or fail (90% success rate for demo purposes)
            if (Math.random() > 0.1) {
              resolve({ success: true });
            } else {
              // Simulate different types of errors
              const errorTypes = [
                { 
                  code: 'DAILY_LIMIT_REACHED',
                  message: 'You have reached the daily limit for this quest type',
                  retryable: false
                },
                { 
                  code: 'NETWORK_ERROR',
                  message: 'Connection issue while completing quest',
                  retryable: true
                },
                { 
                  code: 'VERIFICATION_REQUIRED',
                  message: 'You need to verify your social account first',
                  details: { platform: 'twitter' },
                  retryable: false
                }
              ];
              
              const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
              reject(randomError);
            }
          }, 1500);
        });
      };
      
      // Simulate the API call
      await simulateApiCall();
      
      // Success path
      setCompletionState(prev => ({
        ...prev,
        [questType]: {
          isCompleting: false,
          isCompleted: true,
          error: null
        }
      }));
      
      // Auto-reset the completed state after a few seconds
      setTimeout(() => {
        setCompletionState(prev => ({
          ...prev,
          [questType]: {
            isCompleting: false,
            isCompleted: false,
            error: null
          }
        }));
      }, 3000);
      
    } catch (err) {
      console.error('Error completing quest:', err);
      
      // Set the error state for this quest
      setCompletionState(prev => ({
        ...prev,
        [questType]: {
          isCompleting: false,
          isCompleted: false,
          error: err
        }
      }));
    }
  };
  
  // Handler for retry button in error display
  const handleRetry = (questType) => {
    // Clear the error
    setCompletionState(prev => ({
      ...prev,
      [questType]: {
        isCompleting: false,
        isCompleted: false,
        error: null
      }
    }));
    
    // Try again after a short delay
    setTimeout(() => {
      handleCompleteQuest(questType);
    }, 500);
  };
  
  // Handler for dismiss button in error display
  const handleDismissError = (questType) => {
    setCompletionState(prev => ({
      ...prev,
      [questType]: {
        isCompleting: false,
        isCompleted: false,
        error: null
      }
    }));
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="mb-4">Daily Quests</h3>
        <p className="text-secondary-600">Connect your wallet to view available quests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-secondary-200 mb-4 rounded"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentSeasonId) {
    return (
      <div className="card">
        <h3 className="mb-4">Daily Quests</h3>
        <p className="text-secondary-600">No active season at the moment.</p>
      </div>
    );
  }

  if (quests.length === 0 && !error) {
    return (
      <div className="card">
        <h3 className="mb-4">Daily Quests</h3>
        <p className="text-secondary-600">No quests available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-6">Daily Quests</h3>
      
      {/* Global error for quest loading */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={fetchQuests} 
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}
      
      <div className="space-y-4">
        {quests.map((quest) => {
          const questState = completionState[quest.type] || {
            isCompleting: false,
            isCompleted: false,
            error: null
          };
          
          // Calculate progress if user has participant info
          const completedToday = participantInfo?.questsCompletedToday || 0;
          const remainingToday = Math.max(0, quest.dailyLimit - completedToday);
          const progressPercent = (completedToday / quest.dailyLimit) * 100;
          
          return (
            <div 
              key={quest.type}
              className="border border-secondary-200 rounded-md p-4 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                    {quest.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{quest.name}</h4>
                    <p className="text-sm text-secondary-600">{quest.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-600">{quest.pointsValue} points</div>
                  <div className="text-xs text-secondary-500">
                    {questState.isCompleted ? 
                      'Completed!' : 
                      `${remainingToday} of ${quest.dailyLimit} remaining`
                    }
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full bg-secondary-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${questState.isCompleted ? 100 : progressPercent}%` }}
                ></div>
              </div>
              
              {/* Quest-specific error display */}
              {questState.error && (
                <ErrorDisplay 
                  error={questState.error}
                  onRetry={questState.error.retryable ? () => handleRetry(quest.type) : null}
                  onDismiss={() => handleDismissError(quest.type)}
                  className="mt-3 mb-3"
                />
              )}
              
              <div className="mt-3 flex justify-end">
                <button
                  className={`text-sm btn ${
                    questState.isCompleted || completedToday >= quest.dailyLimit
                      ? 'btn-secondary opacity-50 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                  disabled={questState.isCompleting || questState.isCompleted || completedToday >= quest.dailyLimit}
                  onClick={() => handleCompleteQuest(quest.type)}
                >
                  {questState.isCompleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : questState.isCompleted ? (
                    'Completed!'
                  ) : completedToday >= quest.dailyLimit ? (
                    'Daily Limit Reached'
                  ) : (
                    'Complete Quest'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-secondary-500">
        <p>Quests reset daily at 00:00 UTC. Complete all quests to maximize your score!</p>
      </div>
    </div>
  );
};

export default QuestList;