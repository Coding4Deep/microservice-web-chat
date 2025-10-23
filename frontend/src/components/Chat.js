import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMode, setChatMode] = useState('public');
  const messagesEndRef = useRef(null);
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const CHAT_SERVICE_URL = 'http://localhost:3001';

  useEffect(() => {
    if (location.state?.selectedUser && location.state?.chatMode === 'private') {
      setSelectedUser(location.state.selectedUser);
      setChatMode('private');
    }
  }, [location.state]);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

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
      setMessages(history || []);
    });

    newSocket.on('privateMessageHistory', (history) => {
      const grouped = {};
      (history || []).forEach(msg => {
        const otherUser = msg.username === username ? msg.recipient : msg.username;
        if (!grouped[otherUser]) grouped[otherUser] = [];
        grouped[otherUser].push(msg);
      });
      setPrivateMessages(grouped);
    });

    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('privateMessage', (message) => {
      const otherUser = message.username === username ? message.recipient : message.username;
      setPrivateMessages(prev => ({
        ...prev,
        [otherUser]: [...(prev[otherUser] || []), message]
      }));
    });

    newSocket.on('activeUsers', (users) => {
      setOnlineUsers((users || []).filter(u => u !== username));
    });

    return () => newSocket.close();
  }, [username, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages, selectedUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !connected) return;

    if (chatMode === 'public') {
      socket.emit('sendMessage', {
        username,
        message: newMessage.trim()
      });
    } else if (selectedUser) {
      socket.emit('sendPrivateMessage', {
        username,
        message: newMessage.trim(),
        recipient: selectedUser
      });
    }
    setNewMessage('');
  };

  const handlePublicChatClick = () => {
    setChatMode('public');
    setSelectedUser(null);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setChatMode('private');
  };

  const handleLogout = async () => {
    if (socket) socket.close();
    await logout();
    navigate('/login');
  };

  const currentMessages = chatMode === 'public' ? messages : (privateMessages[selectedUser] || []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3>Chat</h3>
        
        <button 
          onClick={handlePublicChatClick}
          style={{
            ...styles.modeButton,
            backgroundColor: chatMode === 'public' ? '#007bff' : '#e9ecef',
            color: chatMode === 'public' ? 'white' : '#495057'
          }}
        >
          📢 Public Chat
        </button>
        
        <h4 style={styles.sectionTitle}>Online Users ({onlineUsers.length})</h4>
        
        <div style={styles.usersList}>
          {onlineUsers.length > 0 ? (
            onlineUsers.map(user => (
              <button
                key={user}
                onClick={() => handleUserClick(user)}
                style={{
                  ...styles.userButton,
                  backgroundColor: selectedUser === user ? '#007bff' : '#f8f9fa',
                  color: selectedUser === user ? 'white' : '#495057'
                }}
              >
                <span>👤 {user}</span>
                {privateMessages[user] && (
                  <span style={styles.messageCount}>
                    {privateMessages[user].length}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div style={styles.noUsers}>
              {connected ? 'No other users online' : 'Connecting...'}
            </div>
          )}
        </div>

        <div style={styles.statusInfo}>
          <div>Status: {connected ? '🟢 Online' : '🔴 Offline'}</div>
          <div>You: {username}</div>
          {chatMode === 'private' && selectedUser && (
            <div>Chatting with: {selectedUser}</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.header}>
          <h2>
            {chatMode === 'public' 
              ? '📢 Public Chat Room' 
              : `💬 Private Chat with ${selectedUser || 'Select User'}`
            }
          </h2>
          <div>
            <button onClick={() => navigate('/dashboard')} style={styles.headerButton}>
              Dashboard
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        <div style={styles.messagesContainer}>
          {currentMessages.length > 0 ? (
            currentMessages.map((message, index) => (
              <div
                key={message.id || message._id || index}
                style={{
                  ...styles.message,
                  alignSelf: message.username === username ? 'flex-end' : 'flex-start',
                  backgroundColor: message.username === username ? '#007bff' : '#e9ecef',
                  color: message.username === username ? 'white' : '#495057'
                }}
              >
                <div style={styles.messageHeader}>
                  <strong>{message.username}</strong>
                  <span style={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div>{message.message}</div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              {chatMode === 'public' 
                ? '💬 No messages yet. Start the conversation!' 
                : selectedUser 
                  ? `💬 No messages with ${selectedUser} yet. Say hello!`
                  : '👈 Select a user from the sidebar to start private chat'
              }
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={styles.messageForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              chatMode === 'public' 
                ? "Type your message..." 
                : selectedUser 
                  ? `Message ${selectedUser}...` 
                  : "Select a user first"
            }
            style={styles.messageInput}
            disabled={!connected || (chatMode === 'private' && !selectedUser)}
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim() || (chatMode === 'private' && !selectedUser)}
            style={styles.sendButton}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif'
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #dee2e6',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  modeButton: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '20px',
    transition: 'all 0.2s'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#495057'
  },
  usersList: {
    flex: 1,
    overflowY: 'auto'
  },
  userButton: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s'
  },
  messageCount: {
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  noUsers: {
    textAlign: 'center',
    color: '#6c757d',
    padding: '20px',
    fontStyle: 'italic'
  },
  statusInfo: {
    marginTop: 'auto',
    padding: '15px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#495057'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #dee2e6'
  },
  headerButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px',
    borderRadius: '12px',
    wordWrap: 'break-word'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '12px',
    opacity: 0.8
  },
  timestamp: {
    fontSize: '11px'
  },
  emptyState: {
    textAlign: 'center',
    color: '#6c757d',
    padding: '40px',
    fontSize: '16px'
  },
  messageForm: {
    display: 'flex',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6'
  },
  messageInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    marginRight: '10px',
    fontSize: '14px'
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default Chat;
