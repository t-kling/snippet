import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await reviewAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Snippet</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>{user?.email}</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {stats && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.due_today}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Due Today</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_in_queue}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>In Queue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_snippets}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Snippets</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffa500' }}>{stats.needs_work}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Needs Work</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        <Link
          to="/review"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Review Cards {stats && stats.due_today > 0 && `(${stats.due_today})`}
        </Link>

        <Link
          to="/library"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: 'white',
            color: '#333',
            textAlign: 'center',
            textDecoration: 'none',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Browse Library
        </Link>

        <Link
          to="/snippet/new"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Create New Snippet
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
