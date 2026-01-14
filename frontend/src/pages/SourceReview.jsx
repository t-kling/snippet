import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { snippetAPI } from '../api/client';
import Header from '../components/Header';

function SourceReview() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await snippetAPI.getSources();
      setSources(response.data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceSelect = (source) => {
    // Navigate to review filtered by this source
    navigate(`/review?source=${encodeURIComponent(source)}`);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px', textAlign: 'center' }}>
          <p>Loading sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Review by Source</h2>
        <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Select a source to review all cards from it
        </p>

        {sources.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>No sources found. Add source information to your snippets.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => handleSourceSelect(source)}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = 'var(--blue-button)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              >
                {source}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SourceReview;
