/**
 * Twitter API configuration
 */
const { TwitterApi } = require('twitter-api-v2');

// Twitter API credentials from environment variables
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Create a read-only client
const readOnlyClient = twitterClient.readOnly;

module.exports = {
  twitterClient,
  readOnlyClient
};