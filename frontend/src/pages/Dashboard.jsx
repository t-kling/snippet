import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

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
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>

      {stats && (
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--again-red)' }}>{stats.due_today}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Due Today</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total_in_queue}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>In Queue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total_snippets}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Snippets</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--hard-orange)' }}>{stats.to_edit}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>To Edit</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        <Link
          to="/review"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: 'var(--blue-button)',
            color: 'white',
            border: 'none',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Review Snippets {stats && stats.due_today > 0 && `(${stats.due_today})`}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <Link
            to="/review/topic"
            style={{
              display: 'block',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              textDecoration: 'none',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            Review by Topic
          </Link>

          <Link
            to="/review/source"
            style={{
              display: 'block',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              textDecoration: 'none',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            Review by Source
          </Link>
        </div>

        <Link
          to="/library"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            textDecoration: 'none',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '18px',
          }}
        >
          Browse Library
        </Link>

        <Link
          to="/snippet/new"
          style={{
            display: 'block',
            padding: '20px',
            backgroundColor: 'var(--green-button)',
            color: 'white',
            border: 'none',
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
    </div>
  );
}

export default Dashboard;
