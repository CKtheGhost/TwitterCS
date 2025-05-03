/**
 * Migration 3: Update Quests for Ethical Verification
 * 
 * Updates the Quest model to include the ethical verification requirements,
 * privacy policies, and other fields needed for the ethical verification system.
 */
const mongoose = require('mongoose');
const Quest = require('../../models/Quest');

module.exports = {
  /**
   * Apply migration
   */
  up: async () => {
    console.log('Starting migration: Update Quests for Ethical Verification');
    
    try {
      // Check if any quests already have the privacyRequirements field
      const questsWithPrivacy = await Quest.findOne({ privacyRequirements: { $exists: true } });
      
      if (questsWithPrivacy) {
        console.log('Quests already have privacy requirements, skipping migration');
        return;
      }
      
      // Get all quests
      const quests = await Quest.find();
      console.log(`Found ${quests.length} quests to update`);
      
      // Add privacy and verification requirements to each quest
      for (const quest of quests) {
        // Determine required consents based on quest type
        const requiredConsents = [];
        const requiresVerification = quest.platform === 'twitter';
        
        if (quest.platform === 'twitter') {
          if (['post', 'reply'].includes(quest.action)) {
            requiredConsents.push('dataUsage.publicProfile');
          } else if (['like', 'retweet', 'follow'].includes(quest.action)) {
            requiredConsents.push('dataUsage.engagementMetrics');
          }
        }
        
        // Update quest with privacy requirements
        quest.privacyRequirements = {
          requiresVerification,
          requiredConsents,
          dataPurpose: 'Quest completion verification only',
          dataRetention: 'Until quest status change or user data deletion request'
        };
        
        // Update verification method
        quest.verificationMethod = quest.verificationMethod || 'ethical_api';
        
        // Save updated quest
        await quest.save();
      }
      
      console.log('Successfully updated all quests with privacy requirements');
    } catch (error) {
      console.error('Error updating quests for ethical verification:', error);
      throw error;
    }
  },
  
  /**
   * Rollback migration
   */
  down: async () => {
    console.log('Rolling back migration: Update Quests for Ethical Verification');
    
    try {
      // Remove privacy and verification fields from all quests
      const updateResult = await Quest.updateMany(
        {}, // Match all quests
        {
          $unset: {
            privacyRequirements: "",
            verificationMethod: ""
          }
        }
      );
      
      console.log(`Removed privacy fields from ${updateResult.modifiedCount} quest records`);
    } catch (error) {
      console.error('Error removing privacy fields from quests:', error);
      throw error;
    }
  }
};