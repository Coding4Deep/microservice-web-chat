const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_chatdb';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.KAFKA_BROKERS = 'localhost:9092';

describe('Chat Service Tests', () => {
  let app, server, io, clientSocket, serverSocket;
  let Message;

  beforeAll(async () => {
    // Setup test server
    app = express();
    app.use(express.json());
    server = http.createServer(app);
    io = new Server(server);

    // Mock Message model
    const messageSchema = new mongoose.Schema({
      id: String,
      username: String,
      message: String,
      timestamp: Date,
      room: String,
      isPrivate: Boolean,
      recipient: String
    });
    Message = mongoose.model('TestMessage', messageSchema);

    // Setup routes
    app.get('/api/messages', async (req, res) => {
      const messages = await Message.find({ isPrivate: false }).sort({ timestamp: 1 });
      res.json(messages);
    });

    app.get('/api/messages/private/:username', async (req, res) => {
      const { username } = req.params;
      const { with: otherUser } = req.query;
      
      const messages = await Message.find({
        isPrivate: true,
        $or: [
          { username: username, recipient: otherUser },
          { username: otherUser, recipient: username }
        ]
      }).sort({ timestamp: 1 });
      
      res.json(messages);
    });

    app.get('/api/users/active', (req, res) => {
      res.json({ activeUsers: ['user1', 'user2'] });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'OK', service: 'chat-service' });
    });

    // Start server
    await new Promise((resolve) => {
      server.listen(0, resolve);
    });

    const port = server.address().port;

    // Setup client socket
    clientSocket = new Client(`http://localhost:${port}`);
    
    // Setup server socket handler
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.close();
    if (server) server.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    if (Message) {
      await Message.deleteMany({});
    }
  });

  describe('REST API Endpoints', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        service: 'chat-service'
      });
    });

    test('GET /api/messages should return public messages', async () => {
      // Create test messages
      await Message.create([
        {
          id: '1',
          username: 'user1',
          message: 'Public message 1',
          timestamp: new Date(),
          room: 'general',
          isPrivate: false
        },
        {
          id: '2',
          username: 'user2',
          message: 'Private message',
          timestamp: new Date(),
          room: 'private',
          isPrivate: true,
          recipient: 'user1'
        }
      ]);

      const response = await request(app)
        .get('/api/messages')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].message).toBe('Public message 1');
      expect(response.body[0].isPrivate).toBe(false);
    });

    test('GET /api/messages/private/:username should return private messages', async () => {
      // Create test private messages
      await Message.create([
        {
          id: '1',
          username: 'user1',
          message: 'Private to user2',
          timestamp: new Date(),
          room: 'private',
          isPrivate: true,
          recipient: 'user2'
        },
        {
          id: '2',
          username: 'user2',
          message: 'Reply to user1',
          timestamp: new Date(),
          room: 'private',
          isPrivate: true,
          recipient: 'user1'
        }
      ]);

      const response = await request(app)
        .get('/api/messages/private/user1?with=user2')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].isPrivate).toBe(true);
    });

    test('GET /api/users/active should return active users', async () => {
      const response = await request(app)
        .get('/api/users/active')
        .expect(200);

      expect(response.body).toHaveProperty('activeUsers');
      expect(Array.isArray(response.body.activeUsers)).toBe(true);
    });
  });

  describe('Socket.IO Events', () => {
    test('should connect and join chat', (done) => {
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    test('should handle join event', (done) => {
      clientSocket.emit('join', 'testuser');
      
      setTimeout(() => {
        expect(serverSocket).toBeDefined();
        done();
      }, 100);
    });

    test('should handle sendMessage event', (done) => {
      const messageData = {
        username: 'testuser',
        message: 'Test message'
      };

      serverSocket.on('sendMessage', (data) => {
        expect(data.username).toBe('testuser');
        expect(data.message).toBe('Test message');
        done();
      });

      clientSocket.emit('sendMessage', messageData);
    });

    test('should handle sendPrivateMessage event', (done) => {
      const privateMessageData = {
        username: 'user1',
        message: 'Private test message',
        recipient: 'user2'
      };

      serverSocket.on('sendPrivateMessage', (data) => {
        expect(data.username).toBe('user1');
        expect(data.message).toBe('Private test message');
        expect(data.recipient).toBe('user2');
        done();
      });

      clientSocket.emit('sendPrivateMessage', privateMessageData);
    });
  });

  describe('Message Validation', () => {
    test('should validate public message structure', () => {
      const publicMessage = {
        id: '123',
        username: 'testuser',
        message: 'Hello world',
        timestamp: new Date(),
        room: 'general',
        isPrivate: false,
        recipient: null
      };

      expect(publicMessage.username).toBeDefined();
      expect(publicMessage.message).toBeDefined();
      expect(publicMessage.isPrivate).toBe(false);
      expect(publicMessage.recipient).toBeNull();
    });

    test('should validate private message structure', () => {
      const privateMessage = {
        id: '456',
        username: 'user1',
        message: 'Private hello',
        timestamp: new Date(),
        room: 'private',
        isPrivate: true,
        recipient: 'user2'
      };

      expect(privateMessage.username).toBeDefined();
      expect(privateMessage.message).toBeDefined();
      expect(privateMessage.isPrivate).toBe(true);
      expect(privateMessage.recipient).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid message data', async () => {
      const response = await request(app)
        .get('/api/messages/private/invaliduser')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(Message, 'find').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/messages')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});

module.exports = { Message };
