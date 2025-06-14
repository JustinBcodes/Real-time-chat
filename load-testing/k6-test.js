import { check, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const wsConnections = new Counter('websocket_connections');
const wsErrors = new Counter('websocket_errors');
const authErrors = new Counter('auth_errors');
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');
const connectionTime = new Trend('connection_time');
const messageLatency = new Trend('message_latency');

// Test configuration
export const options = {
  scenarios: {
    // Authentication stress test
    auth_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 500 },
        { duration: '10m', target: 1000 },
        { duration: '5m', target: 0 },
      ],
      exec: 'authTest',
    },
    
    // WebSocket chat simulation
    chat_simulation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 500 },
        { duration: '10m', target: 2000 },
        { duration: '15m', target: 5000 }, // Peak load
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      exec: 'chatTest',
    },
    
    // Video call stress test
    video_calls: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      exec: 'videoTest',
    },
    
    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 10000 }, // Sudden spike
        { duration: '2m', target: 10000 },
        { duration: '1m', target: 0 },
      ],
      exec: 'spikeTest',
      startTime: '20m', // Start after other tests
    },
  },
  
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    
    // Error rate thresholds  
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    
    // Custom thresholds
    websocket_connections: ['count>5000'],
    message_latency: ['p(95)<100', 'p(99)<200'], // Message latency < 100ms
    connection_time: ['p(95)<2000'], // Connection time < 2s
    
    // Error thresholds
    websocket_errors: ['rate<0.01'],
    auth_errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';
const WS_URL = __ENV.WS_URL || 'ws://localhost';

// Authentication test
export function authTest() {
  const loginPayload = {
    email: `testuser${__VU}_${__ITER}@example.com`,
    password: 'testpassword123',
  };
  
  // Register user
  let registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
    'register response has token': (r) => JSON.parse(r.body).token !== undefined,
  }) || authErrors.add(1);
  
  sleep(1);
  
  // Login user
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => JSON.parse(r.body).token !== undefined,
  }) || authErrors.add(1);
  
  const token = JSON.parse(loginResponse.body).token;
  
  // Test protected route
  let profileResponse = http.get(`${BASE_URL}/api/auth/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  
  check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
  }) || authErrors.add(1);
  
  sleep(2);
}

// Chat WebSocket test
export function chatTest() {
  const username = `user${__VU}_${__ITER}`;
  const roomId = `room_${Math.floor(Math.random() * 10)}`; // Distribute across 10 rooms
  
  const startTime = Date.now();
  
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
  
  const response = ws.connect(url, {}, function (socket) {
    wsConnections.add(1);
    connectionTime.add(Date.now() - startTime);
    
    let messagesReceived = 0;
    let messagesSentCount = 0;
    
    socket.on('open', () => {
      console.log(`VU ${__VU}: Connected to WebSocket`);
      
      // Join a room
      socket.send(JSON.stringify({
        type: 'join_room',
        roomId: roomId,
        username: username,
      }));
    });
    
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'new_message') {
          messagesReceived++;
          messagesReceived.add(1);
          
          // Calculate message latency
          const latency = Date.now() - message.timestamp;
          messageLatency.add(latency);
        }
      } catch (e) {
        wsErrors.add(1);
      }
    });
    
    socket.on('error', (e) => {
      console.log(`VU ${__VU}: WebSocket error:`, e);
      wsErrors.add(1);
    });
    
    // Send messages periodically
    const interval = setInterval(() => {
      if (socket.readyState === 1) { // OPEN
        const messageData = {
          type: 'send_message',
          roomId: roomId,
          content: `Message ${messagesSentCount} from ${username}`,
          timestamp: Date.now(),
        };
        
        socket.send(JSON.stringify(messageData));
        messagesSent.add(1);
        messagesSentCount++;
      }
    }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds
    
    // Keep connection alive for test duration
    sleep(60 + Math.random() * 120); // 1-3 minutes
    
    clearInterval(interval);
  });
  
  check(response, {
    'websocket connection successful': (r) => r && r.status === 101,
  }) || wsErrors.add(1);
}

// Video call test
export function videoTest() {
  const callId = `call_${__VU}_${__ITER}`;
  
  // Simulate WebRTC signaling
  const signalPayload = {
    callId: callId,
    type: 'offer',
    sdp: 'mock-sdp-offer-data',
    userId: `user_${__VU}`,
  };
  
  let signalResponse = http.post(`${BASE_URL}/api/video/signal`, JSON.stringify(signalPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(signalResponse, {
    'video signal status is 200': (r) => r.status === 200,
  });
  
  sleep(5);
  
  // Simulate call stats
  const statsPayload = {
    callId: callId,
    stats: {
      bandwidth: Math.floor(Math.random() * 1000000),
      latency: Math.floor(Math.random() * 100),
      packetLoss: Math.random() * 0.05,
    },
  };
  
  let statsResponse = http.post(`${BASE_URL}/api/video/stats`, JSON.stringify(statsPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(statsResponse, {
    'video stats status is 200': (r) => r.status === 200,
  });
  
  sleep(10);
}

// Spike test for system resilience
export function spikeTest() {
  // Rapid-fire requests to test system limits
  const requests = [];
  
  for (let i = 0; i < 10; i++) {
    requests.push([
      'GET',
      `${BASE_URL}/health`,
      null,
      { headers: { 'User-Agent': 'k6-spike-test' } }
    ]);
  }
  
  const responses = http.batch(requests);
  
  responses.forEach((response, index) => {
    check(response, {
      [`spike request ${index} status is 200`]: (r) => r.status === 200,
    });
  });
  
  sleep(0.1); // Very short sleep for maximum load
}

// Utility function to generate realistic user data
function generateUserData() {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson'];
  
  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `user${__VU}_${__ITER}_${Date.now()}@loadtest.com`,
  };
}

// Custom teardown for cleanup
export function teardown(data) {
  console.log('Load test completed');
  console.log(`WebSocket connections: ${wsConnections.count}`);
  console.log(`Messages sent: ${messagesSent.count}`);
  console.log(`Messages received: ${messagesReceived.count}`);
  console.log(`WebSocket errors: ${wsErrors.count}`);
  console.log(`Auth errors: ${authErrors.count}`);
} 