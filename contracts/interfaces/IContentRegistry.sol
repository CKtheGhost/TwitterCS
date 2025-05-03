// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IContentRegistry
 * @dev Interface for registering and managing social content
 */
interface IContentRegistry {
    /**
     * @dev Structure representing a content item
     */
    struct ContentItem {
        uint256 id;
        address creator;
        string contentURI;
        uint256 createdAt;
        uint256 engagementScore;
        bool isActive;
    }
    
    /**
     * @dev Event emitted when new content is published
     */
    event ContentPublished(uint256 indexed contentId, address indexed creator, string contentURI);
    
    /**
     * @dev Event emitted when content is updated
     */
    event ContentUpdated(uint256 indexed contentId, string newContentURI);
    
    /**
     * @dev Event emitted when content is removed
     */
    event ContentRemoved(uint256 indexed contentId);
    
    /**
     * @dev Publishes new content to the platform
     * @param contentURI The URI pointing to the content (IPFS or other decentralized storage)
     * @return The ID of the newly created content
     */
    function publishContent(string calldata contentURI) external returns (uint256);
    
    /**
     * @dev Updates existing content
     * @param contentId The ID of the content to update
     * @param newContentURI The new URI for the content
     * @return A boolean indicating whether the operation was successful
     */
    function updateContent(uint256 contentId, string calldata newContentURI) external returns (bool);
    
    /**
     * @dev Removes content from the platform
     * @param contentId The ID of the content to remove
     * @return A boolean indicating whether the operation was successful
     */
    function removeContent(uint256 contentId) external returns (bool);
    
    /**
     * @dev Gets content details
     * @param contentId The ID of the content to query
     * @return The content item details
     */
    function getContent(uint256 contentId) external view returns (ContentItem memory);
}