/**
 * Twitter service for verification and integration
 */
const { readOnlyClient } = require('../config/twitter');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * Generates a unique verification code for Twitter validation
 * @param {string} userId - The user's ID
 * @returns {string} The verification code to be tweeted
 */
const generateVerificationCode = (userId) => {
  const timestamp = Date.now().toString();
  const randomString = crypto.randomBytes(16).toString('hex');
  const data = `${userId}-${timestamp}-${randomString}`;
  // Create a hash of the data
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  // Return a shorter version that's still unique
  return `SENG-${hash.substring(0, 16)}`;
};

/**
 * Store verification code in user's record
 * @param {string} userId - The user's ID
 * @param {string} code - The generated verification code
 * @returns {Promise<boolean>} True if successful
 */
const storeVerificationCode = async (userId, code) => {
  try {
    await User.findByIdAndUpdate(userId, {
      'verification.twitter.code': code,
      'verification.twitter.createdAt': new Date(),
      'verification.twitter.verified': false
    });
    return true;
  } catch (error) {
    console.error('Error storing verification code:', error);
    throw new Error('Failed to store verification code');
  }
};

/**
 * Verify user's Twitter account by checking for verification tweet
 * @param {string} userId - The user's ID
 * @param {string} twitterUsername - The Twitter username to verify
 * @returns {Promise<boolean>} True if verification is successful
 */
const verifyTwitterAccount = async (userId, twitterUsername) => {
  try {
    // Retrieve user's verification code
    const user = await User.findById(userId);
    if (!user || !user.verification || !user.verification.twitter || !user.verification.twitter.code) {
      throw new Error('Verification code not found');
    }

    const verificationCode = user.verification.twitter.code;
    
    // Get user's recent tweets
    const userTweets = await readOnlyClient.v2.userByUsername(twitterUsername);
    if (!userTweets.data) {
      throw new Error('Twitter user not found');
    }

    const twitterUserId = userTweets.data.id;
    const tweets = await readOnlyClient.v2.userTimeline(twitterUserId, {
      max_results: 10,
      exclude: 'replies,retweets'
    });

    // Check if any tweet contains the verification code
    const verified = tweets.data.data.some(tweet => tweet.text.includes(verificationCode));
    
    if (verified) {
      // Update user record
      await User.findByIdAndUpdate(userId, {
        'verification.twitter.verified': true,
        'verification.twitter.verifiedAt': new Date(),
        'verification.twitter.username': twitterUsername,
        'verification.twitter.userId': twitterUserId,
        isVerified: true
      });
    }
    
    return verified;
  } catch (error) {
    console.error('Error verifying Twitter account:', error);
    throw new Error('Failed to verify Twitter account');
  }
};

/**
 * Checks if a user's verification has expired
 * @param {Object} verification - The verification object from user
 * @returns {boolean} True if verification has expired
 */
const isVerificationExpired = (verification) => {
  if (!verification || !verification.twitter || !verification.twitter.createdAt) {
    return true;
  }
  
  const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
  const verificationTime = new Date(verification.twitter.createdAt).getTime();
  return (Date.now() - verificationTime) > expirationTime;
};

/**
 * Gets Twitter user profile information
 * @param {string} username - Twitter username
 * @returns {Promise<Object>} Twitter profile data
 */
const getTwitterProfile = async (username) => {
  try {
    const userResponse = await readOnlyClient.v2.userByUsername(username, {
      'user.fields': 'description,profile_image_url,public_metrics,created_at,verified'
    });
    
    if (!userResponse.data) {
      throw new Error('Twitter user not found');
    }
    
    return userResponse.data;
  } catch (error) {
    console.error('Error fetching Twitter profile:', error);
    throw new Error('Failed to fetch Twitter profile');
  }
};

/**
 * Analyze Twitter account for potential bot indicators
 * @param {string} username - Twitter username
 * @returns {Promise<Object>} Bot analysis results
 */
const analyzePotentialBot = async (username) => {
  try {
    const user = await getTwitterProfile(username);
    const userTimeline = await readOnlyClient.v2.userTimeline(user.id, {
      max_results: 50,
      exclude: 'replies',
      'tweet.fields': 'created_at,public_metrics'
    });
    
    // Bot detection metrics
    const metrics = {
      followerCount: user.public_metrics.followers_count,
      followingCount: user.public_metrics.following_count,
      tweetCount: user.public_metrics.tweet_count,
      accountAge: calculateAccountAge(user.created_at),
      isVerified: user.verified || false,
      hasBio: !!user.description,
      hasProfileImage: !!user.profile_image_url,
      followRatio: calculateFollowRatio(user.public_metrics),
      tweetFrequency: calculateTweetFrequency(userTimeline.data.data)
    };
    
    // Calculate bot probability
    const botScore = calculateBotScore(metrics);
    
    return {
      username,
      metrics,
      botScore,
      isPotentialBot: botScore > 0.7 // Threshold for identifying potential bots
    };
  } catch (error) {
    console.error('Error analyzing Twitter account:', error);
    throw new Error('Failed to analyze Twitter account');
  }
};

// Helper functions for bot detection
const calculateAccountAge = (createdAt) => {
  const creationDate = new Date(createdAt);
  const now = new Date();
  const ageInDays = (now - creationDate) / (1000 * 60 * 60 * 24);
  return ageInDays;
};

const calculateFollowRatio = (metrics) => {
  if (metrics.followers_count === 0) return 0;
  return metrics.following_count / metrics.followers_count;
};

const calculateTweetFrequency = (tweets) => {
  if (!tweets || tweets.length < 2) return 0;
  
  // Sort tweets by creation date
  const sortedTweets = [...tweets].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  // Calculate average time between tweets
  let totalTimeDiff = 0;
  for (let i = 1; i < sortedTweets.length; i++) {
    const prevDate = new Date(sortedTweets[i-1].created_at);
    const currDate = new Date(sortedTweets[i].created_at);
    totalTimeDiff += currDate - prevDate;
  }
  
  // Average time difference in hours
  const avgTimeDiffHours = totalTimeDiff / (sortedTweets.length - 1) / (1000 * 60 * 60);
  return avgTimeDiffHours;
};

const calculateBotScore = (metrics) => {
  let score = 0;
  
  // Newer accounts are more suspicious
  if (metrics.accountAge < 30) score += 0.2;
  
  // Accounts without bio or profile image are suspicious
  if (!metrics.hasBio) score += 0.15;
  if (!metrics.hasProfileImage) score += 0.15;
  
  // Verified accounts are less likely to be bots
  if (metrics.isVerified) score -= 0.3;
  
  // Following many users but having few followers is suspicious
  if (metrics.followRatio > 2) score += 0.2;
  
  // Very high tweet frequency is suspicious
  if (metrics.tweetFrequency < 0.5) score += 0.2; // Less than 30 minutes between tweets
  
  // Normalize score to 0-1 range
  score = Math.max(0, Math.min(1, score));
  
  return score;
};

module.exports = {
  generateVerificationCode,
  storeVerificationCode,
  verifyTwitterAccount,
  isVerificationExpired,
  getTwitterProfile,
  analyzePotentialBot
};