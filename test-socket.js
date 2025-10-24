const io = require('socket.io-client');

console.log('Testing Socket.IO connection...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to chat service');
  socket.emit('join', 'testuser');
  console.log('📡 Sent join event for testuser');
  
  setTimeout(() => {
    console.log('🔍 Checking online users...');
    fetch('http://localhost:3001/api/users/active')
      .then(res => res.json())
      .then(data => {
        console.log('👥 Active users:', data.activeUsers);
        socket.disconnect();
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Error:', err.message);
        socket.disconnect();
        process.exit(1);
      });
  }, 2000);
});

socket.on('activeUsers', (users) => {
  console.log('📢 Received activeUsers event:', users);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from chat service');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);
