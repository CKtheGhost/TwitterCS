// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEngagement
 * @dev Interface for engagement interactions (likes, comments, shares)
 */
interface IEngagement {
    /**
     * @dev Enum representing different engagement types
     */
    enum EngagementType { LIKE, COMMENT, SHARE }
    
    /**
     * @dev Structure representing an engagement action
     */
    struct Engagement {
        uint256 id;
        uint256 contentId;
        address user;
        EngagementType engagementType;
        string data; // Empty for likes, comment text for comments, etc.
        uint256 timestamp;
    }
    
    /**
     * @dev Event emitted when a user engages with content
     */
    event EngagementCreated(
        uint256 indexed engagementId,
        uint256 indexed contentId,
        address indexed user,
        EngagementType engagementType
    );
    
    /**
     * @dev Event emitted when an engagement is removed
     */
    event EngagementRemoved(uint256 indexed engagementId, uint256 indexed contentId);
    
    /**
     * @dev Allows a user to engage with content
     * @param contentId The ID of the content to engage with
     * @param engagementType The type of engagement (like, comment, share)
     * @param data Additional data for the engagement (empty for likes, comment text, etc.)
     * @return The ID of the newly created engagement
     */
    function createEngagement(
        uint256 contentId,
        EngagementType engagementType,
        string calldata data
    ) external returns (uint256);
    
    /**
     * @dev Allows a user to remove their engagement
     * @param engagementId The ID of the engagement to remove
     * @return A boolean indicating whether the operation was successful
     */
    function removeEngagement(uint256 engagementId) external returns (bool);
    
    /**
     * @dev Gets engagement details
     * @param engagementId The ID of the engagement to query
     * @return The engagement details
     */
    function getEngagement(uint256 engagementId) external view returns (Engagement memory);
    
    /**
     * @dev Gets all engagements for a specific content item
     * @param contentId The ID of the content to query engagements for
     * @return An array of engagement IDs
     */
    function getContentEngagements(uint256 contentId) external view returns (uint256[] memory);
    
    /**
     * @dev Gets all engagements by a specific user
     * @param user The address of the user to query engagements for
     * @return An array of engagement IDs
     */
    function getUserEngagements(address user) external view returns (uint256[] memory);
}