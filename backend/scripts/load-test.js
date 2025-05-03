/**
 * Load Test Script for Social Engagement Platform API
 * 
 * This script uses k6 (https://k6.io/) to perform load testing on the API.
 * 
 * To run this test:
 * 1. Install k6: https://k6.io/docs/getting-started/installation/
 * 2. Run: k6 run load-test.js
 * 
 * For distributed load testing, consider using k6 cloud:
 * https://k6.io/docs/cloud/
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');
const authLatency = new Trend('auth_latency');
const questsLatency = new Trend('quests_latency');

// Test configuration
export const options = {
  // Test scenarios
  scenarios: {
    // Smoke test - low load to verify functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      gracefulStop: '5s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - medium load to check performance under normal conditions
    load: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '10s',
      tags: { test_type: 'load' },
    },
    
    // Stress test - high load to find breaking points
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 40 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      tags: { test_type: 'stress' },
      env: { SCENARIO: 'stress' },
    },
  },
  
  // Thresholds for pass/fail criteria
  thresholds: {
    // Error rate threshold
    'errors': ['rate<0.1'], // Error rate < 10%
    
    // Response time thresholds
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'auth_latency': ['p(95)<300'], // 95% of auth requests should be below 300ms
    'quests_latency': ['p(95)<400'], // 95% of quests requests should be below 400ms
    
    // HTTP errors threshold
    'http_req_failed': ['rate<0.05'], // HTTP error rate < 5%
  },
};

// Environment variables
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000';
const AUTH_ENDPOINT = `${API_BASE_URL}/api/auth/login`;
const QUESTS_ENDPOINT = `${API_BASE_URL}/api/quests`;
const USERS_ENDPOINT = `${API_BASE_URL}/api/users`;

// Test data - consider storing more test accounts in an array and cycling through them
const TEST_USER = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!'
};

// Shared token for authenticated requests
let authToken = '';

// Setup function - runs once per VU
export function setup() {
  // Create test user if it doesn't exist
  const createUserRes = http.post(`${API_BASE_URL}/api/auth/register`, JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
    username: 'loadtester',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Login to get token
  const loginRes = http.post(AUTH_ENDPOINT, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'logged in successfully': (r) => r.status === 200 && r.json('token') !== '',
  });
  
  if (loginRes.status === 200) {
    authToken = loginRes.json('token');
  }
  
  return { authToken };
}

// Tear down function - runs at the end of the test
export function teardown(data) {
  // Clean up test data if needed
  console.log('Test completed');
}

// Default function - main test logic
export default function(data) {
  // Group for authentication tests
  group('Authentication', function() {
    // Login request with timing
    const start = new Date();
    const loginRes = http.post(AUTH_ENDPOINT, JSON.stringify(TEST_USER), {
      headers: { 'Content-Type': 'application/json' },
    });
    const end = new Date();
    
    // Record auth latency
    authLatency.add(end - start);
    
    // Check login results
    const loginChecks = check(loginRes, {
      'status is 200': (r) => r.status === 200,
      'has token': (r) => r.json('token') !== '',
    });
    
    // Record errors for failed checks
    errorRate.add(!loginChecks);
    
    // Update auth token if successful
    if (loginRes.status === 200) {
      authToken = loginRes.json('token');
    }
    
    // Small pause between requests
    sleep(1);
  });
  
  // Group for authenticated requests
  group('Quests API', function() {
    // Skip this group if auth failed
    if (!authToken) return;
    
    // Define auth headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
    
    // Get quests list with timing
    const start = new Date();
    const questsRes = http.get(QUESTS_ENDPOINT, { headers });
    const end = new Date();
    
    // Record quests latency
    questsLatency.add(end - start);
    
    // Check quests results
    const questsChecks = check(questsRes, {
      'status is 200': (r) => r.status === 200,
      'has quests array': (r) => Array.isArray(r.json()),
    });
    
    // Record errors for failed checks
    errorRate.add(!questsChecks);
    
    // Create a new quest
    if (__ENV.SCENARIO === 'stress') {
      // Only create quests in stress scenario to avoid excessive data
      const questData = {
        title: `Load Test Quest ${Date.now()}`,
        description: 'This is a quest created by the load test',
        requirements: [
          {
            type: 'social_post',
            data: {
              platform: 'twitter',
              hashtags: ['loadtest']
            }
          }
        ]
      };
      
      const createQuestRes = http.post(QUESTS_ENDPOINT, JSON.stringify(questData), { headers });
      
      check(createQuestRes, {
        'quest created successfully': (r) => r.status === 201,
      });
    }
    
    // Small pause between requests
    sleep(1);
  });
  
  // Group for user profile requests
  group('User Profile', function() {
    // Skip this group if auth failed
    if (!authToken) return;
    
    // Define auth headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
    
    // Get user profile
    const profileRes = http.get(`${USERS_ENDPOINT}/me`, { headers });
    
    check(profileRes, {
      'status is 200': (r) => r.status === 200,
      'has correct email': (r) => r.json('email') === TEST_USER.email,
    });
    
    // Small pause between requests
    sleep(1);
  });
  
  // Random pause between iterations (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}