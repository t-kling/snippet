import { useState, useEffect } from 'react';
import { reviewAPI, snippetAPI } from '../api/client';
import Header from '../components/Header';

function Stats() {
  const [stats, setStats] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [statsRes, snippetsRes] = await Promise.all([
        reviewAPI.getStats(),
        snippetAPI.getAll({ inQueue: 'true' })
      ]);

      setStats(statsRes.data);

      // Calculate detailed statistics
      const snippets = snippetsRes.data;
      const now = new Date();

      // Group by interval buckets
      const intervalBuckets = {
        new: [],
        young: [], // 1-7 days
        mature: [], // 8-21 days
        veteran: [] // 22+ days
      };

      snippets.forEach(s => {
        if (!s.next_review_date) {
          intervalBuckets.new.push(s);
        } else {
          const nextReview = new Date(s.next_review_date);
          const daysSinceCreation = Math.floor((now - new Date(s.created_at)) / (1000 * 60 * 60 * 24));

          if (daysSinceCreation <= 7) {
            intervalBuckets.young.push(s);
          } else if (daysSinceCreation <= 21) {
            intervalBuckets.mature.push(s);
          } else {
            intervalBuckets.veteran.push(s);
          }
        }
      });

      setReviewHistory(intervalBuckets);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px', textAlign: 'center' }}>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <h2 style={{ marginBottom: '30px', color: 'var(--text-primary)' }}>Spaced Repetition Statistics</h2>

        {/* Overview Stats */}
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
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--again-red)' }}>{stats.due_today}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Due Today</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total_in_queue}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>In Queue</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total_snippets}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Cards</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--hard-orange)' }}>{stats.to_edit}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>To Edit</div>
            </div>
          </div>
        )}

        {/* Priority Distribution */}
        {stats && (
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            marginBottom: '30px',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Priority Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{stats.high_priority}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>High Priority</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.medium_priority}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Medium Priority</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#64748b' }}>{stats.low_priority}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Low Priority</div>
              </div>
            </div>
          </div>
        )}

        {/* Card Maturity Distribution */}
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          marginBottom: '30px',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Card Maturity</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>New Cards</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Never reviewed</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--blue-button)' }}>
                {reviewHistory.new?.length || 0}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Young Cards</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>1-7 days old</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--good-green)' }}>
                {reviewHistory.young?.length || 0}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Mature Cards</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>8-21 days old</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--easy-blue)' }}>
                {reviewHistory.mature?.length || 0}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Veteran Cards</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>22+ days old</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea' }}>
                {reviewHistory.veteran?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Helpful Information */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>
            About Spaced Repetition
          </h3>
          <p style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            This app uses an improved SM-2 algorithm with adaptive difficulty and graceful forgetting.
            The algorithm adjusts card intervals based on your performance:
          </p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
            <li><strong>Again:</strong> Resets the card but preserves some progress (1-2 days)</li>
            <li><strong>Hard:</strong> Reduces interval slightly without full reset</li>
            <li><strong>Good:</strong> Standard progression with growing intervals</li>
            <li><strong>Easy:</strong> Accelerates learning for well-known cards</li>
          </ul>
          <p style={{ margin: '10px 0 0 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            Cards are slightly randomized (±10%) to prevent clustering and maintain natural review distribution.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Stats;
