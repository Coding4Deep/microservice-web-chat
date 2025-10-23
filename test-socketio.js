const io = require('socket.io-client');

console.log('Testing Socket.IO connection to chat service...');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to chat service');
  console.log('Socket ID:', socket.id);
  
  // Join as test user
  socket.emit('join', 'testuser');
  console.log('📝 Sent join event for testuser');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from chat service');
});

socket.on('connect_error', (error) => {
  console.error('🔥 Connection error:', error);
});

socket.on('activeUsers', (users) => {
  console.log('👥 Active users received:', users);
});

socket.on('messageHistory', (history) => {
  console.log('📜 Message history received:', history.length, 'messages');
});

socket.on('privateMessageHistory', (history) => {
  console.log('🔒 Private message history received:', history.length, 'messages');
});

// Test sending a message after 2 seconds
setTimeout(() => {
  console.log('📤 Sending test message...');
  socket.emit('sendMessage', {
    username: 'testuser',
    message: 'Test message from Node.js client'
  });
}, 2000);

// Disconnect after 5 seconds
setTimeout(() => {
  console.log('🔌 Disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 5000);
