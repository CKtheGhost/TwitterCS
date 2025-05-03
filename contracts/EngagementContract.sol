// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IEngagement.sol";
import "./interfaces/IContentRegistry.sol";

/**
 * @title EngagementContract
 * @dev Contract for handling user engagement with content (likes, comments, shares)
 */
contract EngagementContract is IEngagement {
    // Platform owner address
    address public owner;
    
    // Content registry contract
    IContentRegistry private _contentRegistry;
    
    // Engagement ID counter
    uint256 private _engagementIdCounter;
    
    // Mapping from engagement ID to Engagement
    mapping(uint256 => Engagement) private _engagements;
    
    // Mapping from content ID to engagement IDs
    mapping(uint256 => uint256[]) private _contentEngagements;
    
    // Mapping from user address to engagement IDs
    mapping(address => uint256[]) private _userEngagements;
    
    /**
     * @dev Constructor that sets the platform owner and content registry
     * @param contentRegistryAddress The address of the ContentRegistry contract
     */
    constructor(address contentRegistryAddress) {
        owner = msg.sender;
        _contentRegistry = IContentRegistry(contentRegistryAddress);
        _engagementIdCounter = 1; // Start IDs at 1
    }
    
    /**
     * @dev Modifier to restrict function access to the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "EngagementContract: caller is not the owner");
        _;
    }
    
    /**
     * @dev See {IEngagement-createEngagement}
     */
    function createEngagement(
        uint256 contentId,
        EngagementType engagementType,
        string calldata data
    ) external override returns (uint256) {
        // Validate the content exists by trying to get it
        _contentRegistry.getContent(contentId);
        
        // For comments, require non-empty data
        if (engagementType == EngagementType.COMMENT) {
            require(bytes(data).length > 0, "EngagementContract: comment text cannot be empty");
        }
        
        uint256 newEngagementId = _engagementIdCounter++;
        
        Engagement memory newEngagement = Engagement({
            id: newEngagementId,
            contentId: contentId,
            user: msg.sender,
            engagementType: engagementType,
            data: data,
            timestamp: block.timestamp
        });
        
        _engagements[newEngagementId] = newEngagement;
        _contentEngagements[contentId].push(newEngagementId);
        _userEngagements[msg.sender].push(newEngagementId);
        
        emit EngagementCreated(newEngagementId, contentId, msg.sender, engagementType);
        
        return newEngagementId;
    }
    
    /**
     * @dev See {IEngagement-removeEngagement}
     */
    function removeEngagement(uint256 engagementId) external override returns (bool) {
        Engagement storage engagement = _engagements[engagementId];
        
        require(engagement.id == engagementId, "EngagementContract: engagement does not exist");
        require(engagement.user == msg.sender, "EngagementContract: caller is not the engagement creator");
        
        // We don't actually delete the engagement, just emit an event to signal removal
        emit EngagementRemoved(engagementId, engagement.contentId);
        
        return true;
    }
    
    /**
     * @dev See {IEngagement-getEngagement}
     */
    function getEngagement(uint256 engagementId) external view override returns (Engagement memory) {
        require(_engagements[engagementId].id == engagementId, "EngagementContract: engagement does not exist");
        return _engagements[engagementId];
    }
    
    /**
     * @dev See {IEngagement-getContentEngagements}
     */
    function getContentEngagements(uint256 contentId) external view override returns (uint256[] memory) {
        return _contentEngagements[contentId];
    }
    
    /**
     * @dev See {IEngagement-getUserEngagements}
     */
    function getUserEngagements(address user) external view override returns (uint256[] memory) {
        return _userEngagements[user];
    }
    
    /**
     * @dev Gets engagements of a specific type for a content item
     * @param contentId The ID of the content to query
     * @param engagementType The type of engagement to filter by
     * @return An array of engagement IDs
     */
    function getContentEngagementsByType(
        uint256 contentId,
        EngagementType engagementType
    ) external view returns (uint256[] memory) {
        uint256[] memory allEngagements = _contentEngagements[contentId];
        uint256 count = 0;
        
        // First, count matching engagements
        for (uint256 i = 0; i < allEngagements.length; i++) {
            if (_engagements[allEngagements[i]].engagementType == engagementType) {
                count++;
            }
        }
        
        // Then create and populate the filtered array
        uint256[] memory filteredEngagements = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEngagements.length; i++) {
            if (_engagements[allEngagements[i]].engagementType == engagementType) {
                filteredEngagements[index] = allEngagements[i];
                index++;
            }
        }
        
        return filteredEngagements;
    }
}