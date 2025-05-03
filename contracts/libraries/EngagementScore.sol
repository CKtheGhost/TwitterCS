// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EngagementScore
 * @dev Library for calculating engagement scores based on interactions
 */
library EngagementScore {
    /**
     * @dev Parameters for scoring algorithm
     * These values could be adjusted based on platform needs
     */
    uint256 private constant LIKE_WEIGHT = 1;
    uint256 private constant COMMENT_WEIGHT = 3;
    uint256 private constant SHARE_WEIGHT = 5;
    uint256 private constant TIME_DECAY_FACTOR = 86400; // 1 day in seconds
    
    /**
     * @dev Calculate the engagement score for content
     * @param likeCount Number of likes
     * @param commentCount Number of comments
     * @param shareCount Number of shares
     * @param ageInSeconds How old the content is in seconds
     * @return The calculated engagement score
     */
    function calculateScore(
        uint256 likeCount,
        uint256 commentCount,
        uint256 shareCount,
        uint256 ageInSeconds
    ) internal pure returns (uint256) {
        // Calculate raw score based on engagement counts and weights
        uint256 rawScore = (likeCount * LIKE_WEIGHT) + 
                          (commentCount * COMMENT_WEIGHT) + 
                          (shareCount * SHARE_WEIGHT);
        
        // Apply time decay (newer content ranks higher)
        uint256 timeDecay = 1 + (ageInSeconds / TIME_DECAY_FACTOR);
        
        // Prevent division by zero
        if (timeDecay == 0) {
            return rawScore;
        }
        
        // Return final score
        return rawScore / timeDecay;
    }
    
    /**
     * @dev Update an existing score when a new engagement is added
     * @param currentScore The current engagement score
     * @param engagementType 0 for like, 1 for comment, 2 for share
     * @param isAddition True if adding engagement, false if removing
     * @return The updated engagement score
     */
    function updateScore(
        uint256 currentScore,
        uint8 engagementType,
        bool isAddition
    ) internal pure returns (uint256) {
        uint256 valueChange;
        
        // Determine the value change based on engagement type
        if (engagementType == 0) {
            valueChange = LIKE_WEIGHT;
        } else if (engagementType == 1) {
            valueChange = COMMENT_WEIGHT;
        } else if (engagementType == 2) {
            valueChange = SHARE_WEIGHT;
        } else {
            return currentScore; // Unknown engagement type
        }
        
        // Add or subtract based on whether it's an addition or removal
        if (isAddition) {
            return currentScore + valueChange;
        } else {
            // Prevent underflow
            return currentScore > valueChange ? currentScore - valueChange : 0;
        }
    }
}