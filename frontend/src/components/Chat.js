import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const CHAT_SERVICE_URL = process.env.REACT_APP_CHAT_SERVICE_URL || 'http://localhost:3001';

  useEffect(() => {
    const newSocket = io(CHAT_SERVICE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join', username);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('messageHistory', (history) => {
      setMessages(history);
    });

    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messageDeleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    newSocket.on('chatCleared', () => {
      setMessages([]);
    });

    newSocket.on('userJoined', (user) => {
      console.log(`${user} joined the chat`);
    });

    newSocket.on('userLeft', (user) => {
      console.log(`${user} left the chat`);
    });

    return () => {
      newSocket.close();
    };
  }, [username, CHAT_SERVICE_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && connected) {
      socket.emit('sendMessage', {
        username,
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && connected) {
      socket.emit('deleteMessage', messageId);
    }
  };

  const clearChat = () => {
    if (socket && connected && window.confirm('Are you sure you want to clear all messages?')) {
      socket.emit('clearChat');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Chat Room</h2>
          <span style={{
            ...styles.status,
            color: connected ? '#28a745' : '#dc3545'
          }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div>
          <button onClick={goToDashboard} style={styles.dashboardButton}>
            Dashboard
          </button>
          <button onClick={clearChat} style={styles.clearButton}>
            Clear Chat
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.message,
              alignSelf: message.username === username ? 'flex-end' : 'flex-start',
              backgroundColor: message.username === username ? '#007bff' : '#f1f1f1',
              color: message.username === username ? 'white' : 'black'
            }}
          >
            <div style={styles.messageHeader}>
              <strong>{message.username}</strong>
              <span style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              {message.username === username && (
                <button
                  onClick={() => deleteMessage(message.id)}
                  style={styles.deleteButton}
                >
                  ×
                </button>
              )}
            </div>
            <div style={styles.messageText}>{message.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.messageInput}
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !newMessage.trim()}
          style={styles.sendButton}
        >
          Send
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa'
  },
  status: {
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  dashboardButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginRight: '0.5rem',
    cursor: 'pointer'
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ffc107',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    marginRight: '0.5rem',
    cursor: 'pointer'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  messagesContainer: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  message: {
    maxWidth: '70%',
    padding: '0.75rem',
    borderRadius: '8px',
    wordWrap: 'break-word'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
    fontSize: '0.8rem'
  },
  timestamp: {
    opacity: 0.7,
    fontSize: '0.7rem'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0 0.25rem'
  },
  messageText: {
    fontSize: '0.9rem'
  },
  messageForm: {
    display: 'flex',
    padding: '1rem',
    borderTop: '1px solid #eee',
    backgroundColor: '#f8f9fa'
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginRight: '0.5rem',
    fontSize: '1rem'
  },
  sendButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default Chat;
