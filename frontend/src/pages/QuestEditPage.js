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
  { value: 'none', label: 'None (On-platform)', description: 'Actions performed directly on our platform' },
  { value: 'twitter', label: 'Twitter', description: 'Actions performed on Twitter' },
  { value: 'discord', label: 'Discord', description: 'Actions performed on Discord' },
  { value: 'telegram', label: 'Telegram', description: 'Actions performed on Telegram' }
];

const QuestEditPage = () => {
  const { isConnected, account } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading state for fetching the quest
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [questId, setQuestId] = useState(null);
  
  // Form state with default values
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    type: '',
    platform: '',
    points: 10,
    dailyLimit: 1,
    season: 1,
    isActive: true,
    requirements: {
      contentMatch: '',
      targetUrl: '',
      minCharacters: 0,
      minWords: 0,
      minCount: 0,
      targetAccount: ''
    },
    validationRules: {
      autoValidate: true,
      requiresProof: false,
      proofType: 'none'
    }
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
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
  
  // Extract quest ID from URL
  useEffect(() => {
    // In a real app, this would use a router param
    // For demo, we'll use a hardcoded ID
    setQuestId('1');
  }, []);
  
  // Fetch quest data
  useEffect(() => {
    const fetchQuest = async () => {
      if (!questId || !isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, this would call the actual API
        // const response = await questService.getQuest(questId);
        
        // For demo purposes, simulate the API response with mock data
        const mockQuest = {
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
            targetUrl: 'https://ourplatform.com',
            minCharacters: 0,
            minWords: 10,
            minCount: 1,
            targetAccount: ''
          },
          validationRules: {
            autoValidate: false,
            requiresProof: true,
            proofType: 'screenshot'
          }
        };
        
        // Simulate API delay
        setTimeout(() => {
          setFormState(mockQuest);
          setLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Error fetching quest:', err);
        setError({
          message: 'Failed to load quest data',
          code: 'FETCH_ERROR',
          retryable: true
        });
        setLoading(false);
      }
    };
    
    fetchQuest();
  }, [questId, isAdmin]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects in form state
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle normal inputs
      setFormState(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseInt(value, 10);
    
    // Handle nested objects in form state
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: numValue
        }
      }));
    } else {
      // Handle normal inputs
      setFormState(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
    
    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formState.title.trim()) errors.title = 'Title is required';
    if (!formState.description.trim()) errors.description = 'Description is required';
    if (!formState.type) errors.type = 'Quest type is required';
    if (!formState.platform) errors.platform = 'Platform is required';
    
    // Number validations
    if (formState.points < 1) errors.points = 'Points must be at least 1';
    if (formState.dailyLimit < 1) errors.dailyLimit = 'Daily limit must be at least 1';
    if (formState.season < 1) errors.season = 'Season must be at least 1';
    
    // Type-specific validations
    if (formState.type === 'post' || formState.type === 'comment') {
      const { minCharacters, minWords } = formState.requirements;
      if (minCharacters < 0) errors['requirements.minCharacters'] = 'Minimum characters cannot be negative';
      if (minWords < 0) errors['requirements.minWords'] = 'Minimum words cannot be negative';
    }
    
    if (formState.type === 'like' || formState.type === 'share') {
      if (formState.requirements.minCount < 1) {
        errors['requirements.minCount'] = 'Minimum count must be at least 1';
      }
    }
    
    if (formState.type === 'follow' && formState.platform !== 'none') {
      if (!formState.requirements.targetAccount.trim()) {
        errors['requirements.targetAccount'] = 'Target account is required for follow quests';
      }
    }
    
    // Validation rules
    if (formState.validationRules.requiresProof && formState.validationRules.proofType === 'none') {
      errors['validationRules.proofType'] = 'Proof type is required when proof is required';
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to the first error
      const firstErrorField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }
    
    // Submit the form
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // In a real app, would call the actual API
      // await questService.updateQuest(questId, formState);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setLoading(false);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      console.error('Error updating quest:', err);
      setError({
        message: 'Failed to update quest',
        code: 'UPDATE_ERROR',
        retryable: true
      });
      setLoading(false);
    }
  };
  
  // Render form fields based on selected quest type
  const renderTypeSpecificFields = () => {
    const { type, platform } = formState;
    
    if (!type) return null;
    
    switch (type) {
      case 'post':
      case 'comment':
        return (
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="requirements.contentMatch">Content Match (Keywords)</label>
              <input
                type="text"
                id="requirements.contentMatch"
                name="requirements.contentMatch"
                value={formState.requirements.contentMatch}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., #hashtag (leave empty for no content matching)"
              />
              {formErrors['requirements.contentMatch'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['requirements.contentMatch']}</p>
              )}
              <p className="text-xs text-secondary-500 mt-1">
                Keywords that must be included in the post/comment
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements.minCharacters">Minimum Characters</label>
              <input
                type="number"
                id="requirements.minCharacters"
                name="requirements.minCharacters"
                value={formState.requirements.minCharacters}
                onChange={handleNumberChange}
                min="0"
                className="form-input"
                placeholder="0"
              />
              {formErrors['requirements.minCharacters'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['requirements.minCharacters']}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements.minWords">Minimum Words</label>
              <input
                type="number"
                id="requirements.minWords"
                name="requirements.minWords"
                value={formState.requirements.minWords}
                onChange={handleNumberChange}
                min="0"
                className="form-input"
                placeholder="0"
              />
              {formErrors['requirements.minWords'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['requirements.minWords']}</p>
              )}
            </div>
          </div>
        );
        
      case 'like':
      case 'share':
        return (
          <div className="space-y-4">
            {platform !== 'none' && (
              <div className="form-group">
                <label htmlFor="requirements.targetUrl">Target URL</label>
                <input
                  type="text"
                  id="requirements.targetUrl"
                  name="requirements.targetUrl"
                  value={formState.requirements.targetUrl}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/post/123"
                />
                {formErrors['requirements.targetUrl'] && (
                  <p className="text-red-500 text-sm mt-1">{formErrors['requirements.targetUrl']}</p>
                )}
                <p className="text-xs text-secondary-500 mt-1">
                  URL of the content to like/share (leave empty for any content)
                </p>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="requirements.minCount">Minimum Count</label>
              <input
                type="number"
                id="requirements.minCount"
                name="requirements.minCount"
                value={formState.requirements.minCount}
                onChange={handleNumberChange}
                min="1"
                className="form-input"
                placeholder="1"
              />
              {formErrors['requirements.minCount'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['requirements.minCount']}</p>
              )}
              <p className="text-xs text-secondary-500 mt-1">
                How many items user needs to like/share to complete the quest
              </p>
            </div>
          </div>
        );
        
      case 'follow':
        return (
          <div className="form-group">
            <label htmlFor="requirements.targetAccount">Target Account</label>
            <input
              type="text"
              id="requirements.targetAccount"
              name="requirements.targetAccount"
              value={formState.requirements.targetAccount}
              onChange={handleInputChange}
              className="form-input"
              placeholder={platform === 'twitter' ? '@username' : 'username'}
            />
            {formErrors['requirements.targetAccount'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['requirements.targetAccount']}</p>
            )}
            <p className="text-xs text-secondary-500 mt-1">
              Account that users need to follow to complete this quest
            </p>
          </div>
        );
        
      case 'invite':
        return (
          <div className="bg-secondary-50 p-4 rounded-md">
            <p className="text-sm">
              Invite quests automatically track when users invite others to the platform.
              No additional configuration needed.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h3 className="mb-4">Edit Quest</h3>
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
  
  if (loading && !formState.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8">Edit Quest</h1>
        <div className="card animate-pulse">
          <div className="h-8 bg-secondary-200 mb-4 rounded"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1>Edit Quest</h1>
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
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">Quest has been updated successfully!</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={handleSubmit} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Quest ID info */}
            <div className="bg-secondary-50 p-4 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Quest ID:</span> {questId}
              </p>
            </div>
            
            {/* Basic Information Section */}
            <section>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group md:col-span-2">
                  <label htmlFor="title">Quest Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formState.title}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.title ? 'border-red-500' : ''}`}
                    placeholder="e.g., Share a Tweet about our platform"
                    required
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                  )}
                </div>
                
                <div className="form-group md:col-span-2">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    className={`form-textarea ${formErrors.description ? 'border-red-500' : ''}`}
                    placeholder="Provide a clear description of what users need to do"
                    rows="3"
                    required
                  ></textarea>
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="type">Quest Type *</label>
                  <select
                    id="type"
                    name="type"
                    value={formState.type}
                    onChange={handleInputChange}
                    className={`form-select ${formErrors.type ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select Quest Type</option>
                    {QUEST_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="platform">Platform *</label>
                  <select
                    id="platform"
                    name="platform"
                    value={formState.platform}
                    onChange={handleInputChange}
                    className={`form-select ${formErrors.platform ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select Platform</option>
                    {PLATFORMS.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.platform && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.platform}</p>
                  )}
                  {formState.platform && (
                    <p className="text-xs text-secondary-500 mt-1">
                      {PLATFORMS.find(p => p.value === formState.platform)?.description}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="points">Points *</label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={formState.points}
                    onChange={handleNumberChange}
                    min="1"
                    className={`form-input ${formErrors.points ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.points && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.points}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="dailyLimit">Daily Completion Limit *</label>
                  <input
                    type="number"
                    id="dailyLimit"
                    name="dailyLimit"
                    value={formState.dailyLimit}
                    onChange={handleNumberChange}
                    min="1"
                    className={`form-input ${formErrors.dailyLimit ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.dailyLimit && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.dailyLimit}</p>
                  )}
                  <p className="text-xs text-secondary-500 mt-1">
                    How many times a user can complete this quest per day
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="season">Season *</label>
                  <input
                    type="number"
                    id="season"
                    name="season"
                    value={formState.season}
                    onChange={handleNumberChange}
                    min="1"
                    className={`form-input ${formErrors.season ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.season && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.season}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formState.isActive}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="isActive" className="ml-2">
                      Active
                    </label>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    If checked, this quest will be immediately available to users
                  </p>
                </div>
              </div>
            </section>
            
            {/* Requirements Section - conditionally rendered based on quest type */}
            {formState.type && (
              <section>
                <h3 className="text-lg font-medium mb-4">Quest Requirements</h3>
                {renderTypeSpecificFields()}
              </section>
            )}
            
            {/* Validation Rules Section */}
            <section>
              <h3 className="text-lg font-medium mb-4">Validation Rules</h3>
              <div className="space-y-4">
                <div className="form-group">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="validationRules.autoValidate"
                      name="validationRules.autoValidate"
                      checked={formState.validationRules.autoValidate}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="validationRules.autoValidate" className="ml-2">
                      Auto-validate
                    </label>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    If checked, quest completions will be automatically validated without admin review
                  </p>
                </div>
                
                <div className="form-group">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="validationRules.requiresProof"
                      name="validationRules.requiresProof"
                      checked={formState.validationRules.requiresProof}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="validationRules.requiresProof" className="ml-2">
                      Requires Proof
                    </label>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    If checked, users will need to provide proof of completion (e.g., screenshot, URL)
                  </p>
                </div>
                
                {formState.validationRules.requiresProof && (
                  <div className="form-group ml-6">
                    <label htmlFor="validationRules.proofType">Proof Type *</label>
                    <select
                      id="validationRules.proofType"
                      name="validationRules.proofType"
                      value={formState.validationRules.proofType}
                      onChange={handleInputChange}
                      className={`form-select ${formErrors['validationRules.proofType'] ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="none">Select Proof Type</option>
                      <option value="screenshot">Screenshot</option>
                      <option value="url">URL</option>
                      <option value="code">Verification Code</option>
                    </select>
                    {formErrors['validationRules.proofType'] && (
                      <p className="text-red-500 text-sm mt-1">{formErrors['validationRules.proofType']}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
            
            {/* Submit button */}
            <div className="flex justify-end pt-4 border-t border-secondary-200">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Quest...
                  </span>
                ) : 'Update Quest'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestEditPage;