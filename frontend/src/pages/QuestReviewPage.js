import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import questService from '../services/questService';
import ErrorDisplay from '../components/ErrorDisplay';

const QuestReviewPage = () => {
  const { isConnected, account } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [selectedCompletion, setSelectedCompletion] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [filters, setFilters] = useState({
    questType: '',
    platform: '',
    startDate: '',
    endDate: ''
  });
  
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
  
  // Fetch pending completions
  useEffect(() => {
    const fetchPendingCompletions = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, would call the actual API
        // const response = await questService.getPendingCompletions(filters);
        
        // For demo purposes, simulate the API response with mock data
        const mockCompletions = [
          {
            id: '1',
            user: {
              id: 'user1',
              username: 'john_doe',
              walletAddress: '0x1234...5678'
            },
            quest: {
              id: 'quest1',
              title: 'Share a Tweet about our platform',
              type: 'share',
              platform: 'twitter',
              points: 50
            },
            submittedAt: new Date('2023-07-01T14:32:00').toISOString(),
            proof: {
              type: 'screenshot',
              url: 'https://example.com/screenshot1.png',
              text: 'Just discovered this amazing platform! #platform #web3 @platform_official'
            },
            status: 'pending'
          },
          {
            id: '2',
            user: {
              id: 'user2',
              username: 'alice_web3',
              walletAddress: '0xabcd...ef01'
            },
            quest: {
              id: 'quest4',
              title: 'Follow our official account',
              type: 'follow',
              platform: 'twitter',
              points: 30
            },
            submittedAt: new Date('2023-07-02T09:15:00').toISOString(),
            proof: {
              type: 'screenshot',
              url: 'https://example.com/screenshot2.png',
              text: 'Following @platform_official'
            },
            status: 'pending'
          },
          {
            id: '3',
            user: {
              id: 'user3',
              username: 'crypto_enthusiast',
              walletAddress: '0x9876...5432'
            },
            quest: {
              id: 'quest1',
              title: 'Share a Tweet about our platform',
              type: 'share',
              platform: 'twitter',
              points: 50
            },
            submittedAt: new Date('2023-07-02T16:45:00').toISOString(),
            proof: {
              type: 'screenshot',
              url: 'https://example.com/screenshot3.png',
              text: 'Check out this cool platform I found! #web3 #platform'
            },
            status: 'pending'
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setPendingCompletions(mockCompletions);
          setLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Error fetching pending completions:', err);
        setError({
          message: 'Failed to load pending quest completions',
          code: 'FETCH_ERROR',
          retryable: true
        });
        setLoading(false);
      }
    };
    
    fetchPendingCompletions();
  }, [isAdmin, filters]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    // In a real app, this would trigger the API call with the updated filters
    setLoading(true);
    // Simulate refresh
    setTimeout(() => setLoading(false), 500);
  };
  
  // Handle selecting a completion for review
  const handleSelectCompletion = (completion) => {
    setSelectedCompletion(completion);
    setReviewResult(null);
    setReviewReason('');
  };
  
  // Handle review result selection
  const handleReviewResult = (result) => {
    setReviewResult(result);
  };
  
  // Handle review reason input
  const handleReviewReason = (e) => {
    setReviewReason(e.target.value);
  };
  
  // Handle submitting the review
  const handleSubmitReview = async () => {
    if (!selectedCompletion || !reviewResult) return;
    
    try {
      // In a real app, would call the actual API
      // await questService.reviewCompletion(selectedCompletion.id, {
      //   result: reviewResult,
      //   reason: reviewReason
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the list by removing the reviewed completion
      setPendingCompletions(pendingCompletions.filter(c => c.id !== selectedCompletion.id));
      
      // Clear selection
      setSelectedCompletion(null);
      setReviewResult(null);
      setReviewReason('');
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError({
        message: 'Failed to submit review',
        code: 'REVIEW_ERROR',
        retryable: true
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h3 className="mb-4">Quest Completion Reviews</h3>
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
      <div className="flex justify-between items-center mb-6">
        <h1>Quest Completion Reviews</h1>
        <a 
          href="/quest-admin" 
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            // In a real app, this would navigate back to the quest admin page
            alert('This would navigate back to the quest admin page in a real app');
          }}
        >
          Back to Quest Management
        </a>
      </div>
      
      {/* Error display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            setError(null);
            setLoading(true);
            // Simulate refresh
            setTimeout(() => setLoading(false), 500);
          }} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Filters and list */}
        <div className="lg:col-span-1">
          {/* Filters */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium mb-4">Filters</h3>
            <form onSubmit={handleApplyFilters}>
              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="questType">Quest Type</label>
                  <select
                    id="questType"
                    name="questType"
                    value={filters.questType}
                    onChange={handleFilterChange}
                    className="form-select"
                  >
                    <option value="">All Types</option>
                    <option value="post">Post</option>
                    <option value="comment">Comment</option>
                    <option value="like">Like</option>
                    <option value="share">Share</option>
                    <option value="follow">Follow</option>
                    <option value="invite">Invite</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="platform">Platform</label>
                  <select
                    id="platform"
                    name="platform"
                    value={filters.platform}
                    onChange={handleFilterChange}
                    className="form-select"
                  >
                    <option value="">All Platforms</option>
                    <option value="none">On-platform</option>
                    <option value="twitter">Twitter</option>
                    <option value="discord">Discord</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="form-input"
                  />
                </div>
                
                <button type="submit" className="btn btn-primary w-full">
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
          
          {/* Completion list */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Pending Reviews ({pendingCompletions.length})</h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-secondary-100 h-20 rounded-md"></div>
                ))}
              </div>
            ) : pendingCompletions.length === 0 ? (
              <div className="bg-secondary-50 p-4 rounded-md text-center">
                <p className="text-secondary-600">No pending reviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCompletions.map(completion => (
                  <div 
                    key={completion.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${
                      selectedCompletion?.id === completion.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-primary-200'
                    }`}
                    onClick={() => handleSelectCompletion(completion)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{completion.user.username}</h4>
                        <p className="text-xs text-secondary-500">{completion.quest.title}</p>
                      </div>
                      <div className="text-xs text-secondary-500">
                        {formatDate(completion.submittedAt)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 mr-2">
                        {completion.quest.platform}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800">
                        {completion.quest.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Review details */}
        <div className="lg:col-span-2">
          <div className="card">
            {selectedCompletion ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Review Submission</h3>
                
                <div className="space-y-6">
                  {/* User info */}
                  <div className="bg-secondary-50 p-4 rounded-md">
                    <h4 className="font-medium mb-2">User Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-secondary-500">Username:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.user.username}</span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Wallet:</span>
                        <span className="ml-1 font-medium">{selectedCompletion.user.walletAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quest info */}
                  <div className="border-b border-secondary-200 pb-4">
                    <h4 className="font-medium mb-2">Quest Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-secondary-500">Title:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.quest.title}</span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Type:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.quest.type}</span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Platform:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.quest.platform}</span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Points:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.quest.points}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Proof section */}
                  <div className="border-b border-secondary-200 pb-4">
                    <h4 className="font-medium mb-2">Proof of Completion</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-secondary-500">Type:</span> 
                        <span className="ml-1 font-medium">{selectedCompletion.proof.type}</span>
                      </div>
                      
                      {selectedCompletion.proof.url && (
                        <div>
                          <span className="text-secondary-500">Screenshot:</span>
                          <div className="mt-2 border border-secondary-200 rounded-md p-2 bg-secondary-50">
                            {/* In a real app, this would be an actual image */}
                            <div className="h-48 bg-secondary-200 rounded flex items-center justify-center text-secondary-500">
                              Screenshot Preview
                              <br />
                              (Click to view full size)
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompletion.proof.text && (
                        <div>
                          <span className="text-secondary-500">Content Text:</span>
                          <div className="mt-1 border border-secondary-200 rounded-md p-3 bg-secondary-50 text-sm">
                            {selectedCompletion.proof.text}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-secondary-500">Submitted:</span> 
                        <span className="ml-1 font-medium">{formatDate(selectedCompletion.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review decision */}
                  <div>
                    <h4 className="font-medium mb-3">Review Decision</h4>
                    <div className="flex space-x-3 mb-4">
                      <button
                        className={`btn ${
                          reviewResult === 'approve' 
                            ? 'btn-success' 
                            : 'btn-secondary'
                        }`}
                        onClick={() => handleReviewResult('approve')}
                      >
                        Approve
                      </button>
                      <button
                        className={`btn ${
                          reviewResult === 'reject' 
                            ? 'btn-danger' 
                            : 'btn-secondary'
                        }`}
                        onClick={() => handleReviewResult('reject')}
                      >
                        Reject
                      </button>
                    </div>
                    
                    {reviewResult && (
                      <div className="space-y-3">
                        <div className="form-group">
                          <label htmlFor="reviewReason">Review Notes (optional)</label>
                          <textarea
                            id="reviewReason"
                            name="reviewReason"
                            value={reviewReason}
                            onChange={handleReviewReason}
                            className="form-textarea"
                            rows="3"
                            placeholder={reviewResult === 'approve' 
                              ? 'Add any notes about this approval...' 
                              : 'Explain why this submission was rejected...'}
                          ></textarea>
                        </div>
                        
                        <button
                          className="btn btn-primary w-full"
                          onClick={handleSubmitReview}
                        >
                          Submit Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-secondary-300 mx-auto mb-4">
                  <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
                <h4 className="font-medium text-secondary-700 mb-2">Select a submission to review</h4>
                <p className="text-secondary-500 text-sm">
                  Click on a submission from the list on the left to start reviewing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestReviewPage;