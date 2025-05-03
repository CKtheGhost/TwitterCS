// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IContentRegistry.sol";
import "./libraries/EngagementScore.sol";

/**
 * @title ContentRegistry
 * @dev Contract for registering and managing social content
 */
contract ContentRegistry is IContentRegistry {
    // Platform owner address
    address public owner;
    
    // Content ID counter
    uint256 private _contentIdCounter;
    
    // Mapping from content ID to ContentItem
    mapping(uint256 => ContentItem) private _contents;
    
    // Mapping from creator address to their content IDs
    mapping(address => uint256[]) private _creatorContents;
    
    /**
     * @dev Constructor that sets the platform owner
     */
    constructor() {
        owner = msg.sender;
        _contentIdCounter = 1; // Start IDs at 1
    }
    
    /**
     * @dev Modifier to restrict function access to the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "ContentRegistry: caller is not the owner");
        _;
    }
    
    /**
     * @dev Modifier to ensure only the content creator can update/remove their content
     */
    modifier onlyCreator(uint256 contentId) {
        require(_contents[contentId].creator == msg.sender, "ContentRegistry: caller is not the content creator");
        _;
    }
    
    /**
     * @dev See {IContentRegistry-publishContent}
     */
    function publishContent(string calldata contentURI) external override returns (uint256) {
        require(bytes(contentURI).length > 0, "ContentRegistry: content URI cannot be empty");
        
        uint256 newContentId = _contentIdCounter++;
        
        ContentItem memory newContent = ContentItem({
            id: newContentId,
            creator: msg.sender,
            contentURI: contentURI,
            createdAt: block.timestamp,
            engagementScore: 0,
            isActive: true
        });
        
        _contents[newContentId] = newContent;
        _creatorContents[msg.sender].push(newContentId);
        
        emit ContentPublished(newContentId, msg.sender, contentURI);
        
        return newContentId;
    }
    
    /**
     * @dev See {IContentRegistry-updateContent}
     */
    function updateContent(uint256 contentId, string calldata newContentURI) 
        external 
        override 
        onlyCreator(contentId) 
        returns (bool) 
    {
        require(_contents[contentId].isActive, "ContentRegistry: content is not active");
        require(bytes(newContentURI).length > 0, "ContentRegistry: content URI cannot be empty");
        
        _contents[contentId].contentURI = newContentURI;
        
        emit ContentUpdated(contentId, newContentURI);
        
        return true;
    }
    
    /**
     * @dev See {IContentRegistry-removeContent}
     */
    function removeContent(uint256 contentId) 
        external 
        override 
        onlyCreator(contentId) 
        returns (bool) 
    {
        require(_contents[contentId].isActive, "ContentRegistry: content is not active");
        
        _contents[contentId].isActive = false;
        
        emit ContentRemoved(contentId);
        
        return true;
    }
    
    /**
     * @dev See {IContentRegistry-getContent}
     */
    function getContent(uint256 contentId) external view override returns (ContentItem memory) {
        require(_contents[contentId].id == contentId, "ContentRegistry: content does not exist");
        return _contents[contentId];
    }
    
    /**
     * @dev Gets all content created by a specific user
     * @param creator The address of the content creator
     * @return An array of content IDs
     */
    function getCreatorContent(address creator) external view returns (uint256[] memory) {
        return _creatorContents[creator];
    }
    
    /**
     * @dev Updates the engagement score for a content item
     * @param contentId The ID of the content to update
     * @param engagementType Type of engagement (0 for like, 1 for comment, 2 for share)
     * @param isAddition True if adding engagement, false if removing
     * @return The updated engagement score
     */
    function updateEngagementScore(
        uint256 contentId,
        uint8 engagementType,
        bool isAddition
    ) external onlyOwner returns (uint256) {
        require(_contents[contentId].id == contentId, "ContentRegistry: content does not exist");
        
        uint256 currentScore = _contents[contentId].engagementScore;
        uint256 newScore = EngagementScore.updateScore(currentScore, engagementType, isAddition);
        
        _contents[contentId].engagementScore = newScore;
        
        return newScore;
    }
}