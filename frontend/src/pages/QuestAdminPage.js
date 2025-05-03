import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import questService from '../services/questService';
import ErrorDisplay from '../components/ErrorDisplay';

const QUEST_TYPES = [
  { value: 'post', label: 'Post', description: 'Create a new post' },
  { value: 'comment', label: 'Comment', description: 'Leave a comment on content' },
  { value: 'like', label: 'Like', description: 'Like content from other users' },
  { value: 'share', label: 'Share', description: 'Share content with your network' },
  { value: 'follow', label: 'Follow', description: 'Follow another user' },
  { value: 'invite', label: 'Invite', description: 'Invite a new user to join' }
];

const PLATFORMS = [
  { value: 'none', label: 'None (On-platform)' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' }
];

const QuestAdminPage = () => {
  const { isConnected, account, contracts } = useWeb3();
  const [activeTab, setActiveTab] = useState('quests');
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !account) {
        setIsAdmin(false);
        return;
      }
      
      try {
        // In a real app, check if user is admin via backend
        // For demo purposes, let's assume the connected account is admin
        setIsAdmin(true);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [isConnected, account]);
  
  // Fetch quests for admin
  useEffect(() => {
    const fetchQuests = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, we'd use the actual API:
        // const response = await questService.getAllQuests({ includeInactive: true });
        // if (response.success) {
        //   setQuests(response.data.data);
        // }
        
        // For demo purposes, simulate the API response with mock data
        const mockQuests = [
          {
            id: '1',
            title: 'Share a Tweet about our platform',
            description: 'Share information about our platform on Twitter to earn points',
            type: 'share',
            platform: 'twitter',
            points: 50,
            dailyLimit: 1,
            isActive: true,
            season: 1,
            requirements: {
              contentMatch: 'platform',
              minWords: 10
            },
            validationRules: {
              autoValidate: false,
              requiresProof: true,
              proofType: 'screenshot'
            }
          },
          {
            id: '2',
            title: 'Like 3 posts in the community',
            description: 'Like at least 3 posts from other users in our platform',
            type: 'like',
            platform: 'none',
            points: 20,
            dailyLimit: 5,
            isActive: true,
            season: 1,
            requirements: {
              minCount: 3
            },
            validationRules: {
              autoValidate: true,
              requiresProof: false
            }
          },
          {
            id: '3',
            title: 'Invite a new user',
            description: 'Invite a new user to join the platform',
            type: 'invite',
            platform: 'none',
            points: 100,
            dailyLimit: 2,
            isActive: false,
            season: 1,
            requirements: {},
            validationRules: {
              autoValidate: true,
              requiresProof: false
            }
          },
          {
            id: '4',
            title: 'Follow our official account',
            description: 'Follow our official Twitter account',
            type: 'follow',
            platform: 'twitter',
            points: 30,
            dailyLimit: 1,
            isActive: true,
            season: 1,
            requirements: {
              targetAccount: '@platform_official'
            },
            validationRules: {
              autoValidate: false,
              requiresProof: true,
              proofType: 'screenshot'
            }
          }
        ];
        
        setTimeout(() => {
          setQuests(mockQuests);
          setLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Error fetching quests:', err);
        setError({
          message: 'Failed to load quests',
          code: 'FETCH_ERROR',
          retryable: true
        });
        setLoading(false);
      }
    };
    
    fetchQuests();
  }, [isAdmin]);
  
  // Function to handle quest deletion (deactivation)
  const handleDeactivateQuest = async (questId) => {
    if (!isAdmin || !questId) return;
    
    try {
      // In a real app, call the actual API
      // await questService.deactivateQuest(questId);
      
      // For demo, update the local state
      setQuests(quests.map(quest => 
        quest.id === questId ? { ...quest, isActive: false } : quest
      ));
      
    } catch (err) {
      console.error('Error deactivating quest:', err);
      setError({
        message: 'Failed to deactivate quest',
        code: 'UPDATE_ERROR',
        retryable: true
      });
    }
  };
  
  // Function to handle quest activation
  const handleActivateQuest = async (questId) => {
    if (!isAdmin || !questId) return;
    
    try {
      // In a real app, call the actual API
      // await questService.activateQuest(questId);
      
      // For demo, update the local state
      setQuests(quests.map(quest => 
        quest.id === questId ? { ...quest, isActive: true } : quest
      ));
      
    } catch (err) {
      console.error('Error activating quest:', err);
      setError({
        message: 'Failed to activate quest',
        code: 'UPDATE_ERROR',
        retryable: true
      });
    }
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h3 className="mb-4">Quest Administration</h3>
          <p className="text-secondary-600">Please connect your wallet to access admin functions.</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h3 className="mb-4">Access Restricted</h3>
          <p className="text-red-600">You do not have permission to access this page.</p>
          <p className="text-secondary-600 mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8">Quest Administration</h1>
      
      {/* Tabs navigation */}
      <div className="flex border-b border-secondary-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'quests' 
              ? 'text-primary-600 border-b-2 border-primary-500' 
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
          onClick={() => setActiveTab('quests')}
        >
          Quest Management
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'reviews' 
              ? 'text-primary-600 border-b-2 border-primary-500' 
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Completion Reviews
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'stats' 
              ? 'text-primary-600 border-b-2 border-primary-500' 
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      {/* Error display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => setError(null)} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}
      
      {/* Quest Management Tab */}
      {activeTab === 'quests' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2>Quest Management</h2>
            <a 
              href="/quest-create" 
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                // In a real app, this would navigate to the quest creation page
                alert('This would navigate to the quest creation page in a real app');
              }}
            >
              Create New Quest
            </a>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4" data-testid="loading-skeleton">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-secondary-100 h-24 rounded-md"></div>
              ))}
            </div>
          ) : quests.length === 0 ? (
            <div className="card bg-secondary-50">
              <p>No quests found. Create your first quest to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quests.map(quest => (
                <div 
                  key={quest.id}
                  className={`border rounded-md p-4 ${
                    quest.isActive 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-secondary-200 bg-secondary-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-semibold">{quest.title}</h3>
                        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                          quest.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {quest.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800">
                          Season {quest.season}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">{quest.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-secondary-500">Type:</span> 
                          <span className="ml-1 font-medium">{quest.type}</span>
                        </div>
                        <div>
                          <span className="text-secondary-500">Platform:</span> 
                          <span className="ml-1 font-medium">{quest.platform}</span>
                        </div>
                        <div>
                          <span className="text-secondary-500">Points:</span> 
                          <span className="ml-1 font-medium">{quest.points}</span>
                        </div>
                        <div>
                          <span className="text-secondary-500">Daily Limit:</span> 
                          <span className="ml-1 font-medium">{quest.dailyLimit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          // In a real app, this would navigate to the quest edit page
                          alert(`This would edit quest ${quest.id} in a real app`);
                        }}
                      >
                        Edit
                      </button>
                      {quest.isActive ? (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivateQuest(quest.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleActivateQuest(quest.id)}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Completion Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          <h2 className="mb-6">Quest Completion Reviews</h2>
          <div className="bg-secondary-50 rounded-md p-6 text-center">
            <p className="mb-4">Quest completion review functionality will be implemented soon.</p>
            <p className="text-sm text-secondary-600">This feature will allow admins to review and approve quest completions that require manual verification.</p>
          </div>
        </div>
      )}
      
      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          <h2 className="mb-6">Quest Statistics</h2>
          <div className="bg-secondary-50 rounded-md p-6 text-center">
            <p className="mb-4">Quest statistics dashboard will be implemented soon.</p>
            <p className="text-sm text-secondary-600">This feature will provide insights into quest completions, popular quests, and user engagement.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestAdminPage;