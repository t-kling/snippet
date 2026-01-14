import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { topicAPI, snippetAPI } from '../api/client';
import Header from '../components/Header';

function TopicReview() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const response = await topicAPI.getAll();
      setTopics(response.data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = async (topicName) => {
    // Navigate to review filtered by this topic
    navigate(`/review?topic=${encodeURIComponent(topicName)}`);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px', textAlign: 'center' }}>
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Review by Topic</h2>
        <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Select a topic to review all cards tagged with it
        </p>

        {topics.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>No topics found. Add topics to your snippets to organize them.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.name)}
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
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{topic.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {topic.snippet_count} {topic.snippet_count === 1 ? 'card' : 'cards'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicReview;
