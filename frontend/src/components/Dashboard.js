import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goToChat = () => {
    navigate('/chat');
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Welcome, {username}!</h1>
        <div>
          <button onClick={goToChat} style={styles.chatButton}>
            Go to Chat
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>Total Users</h3>
          <p style={styles.statNumber}>{dashboardData?.totalUsers || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Active Users</h3>
          <p style={styles.statNumber}>{dashboardData?.activeUsers || 0}</p>
        </div>
      </div>

      <div style={styles.usersList}>
        <h2>All Users</h2>
        <div style={styles.usersGrid}>
          {dashboardData?.users?.map(user => (
            <div key={user.id} style={styles.userCard}>
              <div style={styles.userInfo}>
                <h4>{user.username}</h4>
                <p>{user.email}</p>
                <span style={{
                  ...styles.status,
                  backgroundColor: user.active ? '#28a745' : '#6c757d'
                }}>
                  {user.active ? 'Online' : 'Offline'}
                </span>
              </div>
              {user.lastSeen && (
                <p style={styles.lastSeen}>
                  Last seen: {new Date(user.lastSeen).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee'
  },
  chatButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginRight: '1rem',
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
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '0.5rem 0'
  },
  usersList: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  userCard: {
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '1rem'
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  status: {
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.8rem'
  },
  lastSeen: {
    fontSize: '0.8rem',
    color: '#666',
    margin: 0
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.2rem'
  }
};

export default Dashboard;
