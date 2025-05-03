import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Define metrics
const failedRequests = new Counter('failed_requests');

// Default options for tests
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 20 },  // Ramp up to 20 users
    { duration: '2m', target: 20 },  // Stay at 20 users for 2 minutes
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    failed_requests: ['count<10'],    // Less than 10 failed requests
  },
};

// Test auth token (would normally be generated at test start)
const TOKEN = 'user-jwt-token';

export default function () {
  // Set base URL for the API
  const baseUrl = 'http://localhost:3001/api';
  
  // Set common headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };

  // GET available quests
  const availableQuestsResponse = http.get(`${baseUrl}/quests/available`, { headers });
  
  check(availableQuestsResponse, {
    'Available quests status 200': (r) => r.status === 200,
    'Available quests is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    'Available quests has data': (r) => r.json().data.length > 0,
  }) || failedRequests.add(1);
  
  // Random sleep between requests (100-500ms)
  sleep(randomIntBetween(0.1, 0.5));
  
  // GET quest stats
  const statsResponse = http.get(`${baseUrl}/quests/stats`, { headers });
  
  check(statsResponse, {
    'Stats status 200': (r) => r.status === 200,
    'Stats is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    'Stats contains expected fields': (r) => {
      const body = r.json();
      return body.data &&
        typeof body.data.totalPoints === 'number' &&
        typeof body.data.completedQuests === 'number';
    },
  }) || failedRequests.add(1);
  
  // Random sleep between requests (100-500ms)
  sleep(randomIntBetween(0.1, 0.5));
  
  // GET quest completions
  const completionsResponse = http.get(`${baseUrl}/quests/completions?page=1&limit=10`, { headers });
  
  check(completionsResponse, {
    'Completions status 200': (r) => r.status === 200,
    'Completions is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    'Completions has pagination': (r) => r.json().pagination !== undefined,
  }) || failedRequests.add(1);
  
  // Longer sleep between iterations (1-3 seconds)
  sleep(randomIntBetween(1, 3));
}

// Function to simulate complete quest load
export function completeQuest() {
  const baseUrl = 'http://localhost:3001/api';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };
  
  // First, get available quests
  const availableQuestsResponse = http.get(`${baseUrl}/quests/available`, { headers });
  
  if (availableQuestsResponse.status !== 200) {
    failedRequests.add(1);
    return;
  }
  
  const availableQuests = availableQuestsResponse.json().data;
  
  if (availableQuests.length === 0) {
    console.log('No available quests to complete');
    return;
  }
  
  // Pick a random quest
  const questIndex = randomIntBetween(0, availableQuests.length - 1);
  const quest = availableQuests[questIndex];
  
  // Prepare completion data
  const completionData = {
    content: `Testing quest completion for ${quest.title} #TestLoadTesting`,
    proof: 'https://example.com/proof/12345',
  };
  
  // Complete the quest
  const completeResponse = http.post(
    `${baseUrl}/quests/${quest._id}/complete`,
    JSON.stringify(completionData),
    { headers }
  );
  
  check(completeResponse, {
    'Complete quest status 200': (r) => r.status === 200,
    'Complete quest is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    'Complete quest success': (r) => r.json().success === true,
  }) || failedRequests.add(1);
  
  // Sleep after completion (2-5 seconds)
  sleep(randomIntBetween(2, 5));
}