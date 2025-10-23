const io = require('socket.io-client');
const axios = require('axios');

const CHAT_SERVICE_URL = 'http://localhost:3001';
const USER_SERVICE_URL = 'http://localhost:8080';

async function testChatFunctionality() {
  console.log('🧪 Testing Chat Service Functionality...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/health`);
    console.log('✅ Health Check:', response.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: API Endpoints
  console.log('\n2. Testing API Endpoints...');
  try {
    const messagesResponse = await axios.get(`${CHAT_SERVICE_URL}/api/messages`);
    console.log('✅ Messages API:', messagesResponse.data.length, 'messages');
    
    const activeUsersResponse = await axios.get(`${CHAT_SERVICE_URL}/api/users/active`);
    console.log('✅ Active Users API:', activeUsersResponse.data.activeUsers.length, 'active users');
  } catch (error) {
    console.log('❌ API Test Failed:', error.message);
  }

  // Test 3: Socket.IO Connection
  console.log('\n3. Testing Socket.IO Connection...');
  
  const socket1 = io(CHAT_SERVICE_URL);
  const socket2 = io(CHAT_SERVICE_URL);
  
  let testResults = {
    connection1: false,
    connection2: false,
    userJoin: false,
    publicMessage: false,
    privateMessage: false,
    activeUsers: false
  };

  // Socket 1 (User: testuser)
  socket1.on('connect', () => {
    console.log('✅ Socket 1 connected');
    testResults.connection1 = true;
    socket1.emit('join', 'testuser');
  });

  socket1.on('messageHistory', (history) => {
    console.log('✅ Socket 1 received message history:', history.length, 'messages');
  });

  socket1.on('activeUsers', (users) => {
    console.log('✅ Socket 1 received active users:', users);
    testResults.activeUsers = true;
  });

  socket1.on('message', (message) => {
    console.log('✅ Socket 1 received public message:', message.message);
    testResults.publicMessage = true;
  });

  socket1.on('privateMessage', (message) => {
    console.log('✅ Socket 1 received private message:', message.message);
    testResults.privateMessage = true;
  });

  // Socket 2 (User: deepak)
  socket2.on('connect', () => {
    console.log('✅ Socket 2 connected');
    testResults.connection2 = true;
    socket2.emit('join', 'deepak');
    
    // Wait a bit then start testing
    setTimeout(() => {
      console.log('\n4. Testing Public Messaging...');
      socket2.emit('sendMessage', {
        username: 'deepak',
        message: 'Hello from test script! 🚀'
      });
      
      setTimeout(() => {
        console.log('\n5. Testing Private Messaging...');
        socket2.emit('sendPrivateMessage', {
          username: 'deepak',
          message: 'Private message test! 💬',
          recipient: 'testuser'
        });
        
        // Wait and then close connections
        setTimeout(() => {
          console.log('\n📊 Test Results Summary:');
          console.log('Connection 1:', testResults.connection1 ? '✅' : '❌');
          console.log('Connection 2:', testResults.connection2 ? '✅' : '❌');
          console.log('Active Users:', testResults.activeUsers ? '✅' : '❌');
          console.log('Public Message:', testResults.publicMessage ? '✅' : '❌');
          console.log('Private Message:', testResults.privateMessage ? '✅' : '❌');
          
          const allPassed = Object.values(testResults).every(result => result);
          console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
          
          socket1.close();
          socket2.close();
          process.exit(0);
        }, 2000);
      }, 1000);
    }, 1000);
  });

  socket1.on('disconnect', () => {
    console.log('Socket 1 disconnected');
  });

  socket2.on('disconnect', () => {
    console.log('Socket 2 disconnected');
  });

  // Handle connection errors
  socket1.on('connect_error', (error) => {
    console.log('❌ Socket 1 connection error:', error.message);
  });

  socket2.on('connect_error', (error) => {
    console.log('❌ Socket 2 connection error:', error.message);
  });
}

// Run the test
testChatFunctionality().catch(console.error);
