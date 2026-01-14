import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { reviewAPI } from '../api/client';
import { renderMixedContent } from '../utils/latex';
import ImageWithClozes from '../components/ImageWithClozes';
import Header from '../components/Header';

function Review() {
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [includeToEdit, setIncludeToEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState('study'); // 'study', 'browse', 'appreciation'
  const navigate = useNavigate();

  const topic = searchParams.get('topic');
  const source = searchParams.get('source');

  useEffect(() => {
    console.log('useEffect triggered - reviewMode:', reviewMode);
    loadCards();
  }, [includeToEdit, topic, source, reviewMode]);

  const loadCards = async () => {
    console.log('loadCards called with mode:', reviewMode);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        includeToEdit: includeToEdit.toString(),
        mode: reviewMode
      });
      if (topic) params.append('topic', topic);
      if (source) params.append('source', source);

      console.log('Making API request with params:', params.toString());
      const response = await reviewAPI.getDue(params.toString());
      console.log('API response:', response.data.length, 'cards');
      setCards(response.data);
      setCurrentIndex(0);
      setShowAnswer(reviewMode === 'appreciation');
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (quality) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      // Only submit rating to backend in study mode
      if (reviewMode === 'study') {
        await reviewAPI.submit(currentCard.id, quality);
      }

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(reviewMode === 'appreciation'); // Auto-show in appreciation mode
      } else {
        // Finished all cards
        setCards([]);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(reviewMode === 'appreciation');
    } else {
      setCards([]);
    }
  };

  // Auto-show answer in appreciation mode when card changes
  useEffect(() => {
    if (reviewMode === 'appreciation') {
      setShowAnswer(true);
    }
  }, [currentIndex, reviewMode]);

  if (loading) {
    return (
      <div>
        <div style={{
          backgroundColor: 'var(--header-dark)',
          padding: '20px 0',
          marginBottom: '30px',
          borderBottom: '3px solid var(--border-color)',
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h1 style={{
              color: 'var(--cream)',
              margin: 0,
              fontFamily: "'Baskerville', 'Libre Baskerville', 'Palatino', serif",
              fontSize: '36px',
              fontWeight: '400',
              letterSpacing: '0.05em',
            }}>
              Snippet
            </h1>
          </div>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px', textAlign: 'center' }}>
          <p>Loading cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    const getMessage = () => {
      if (reviewMode === 'study') {
        return 'No cards due for review right now.';
      } else if (reviewMode === 'browse' || reviewMode === 'appreciation') {
        return 'No learned cards in your queue.';
      }
      return 'No cards available.';
    };

    return (
      <div>
        <Header />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Review
              {topic && <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-secondary)' }}> • Topic: {topic}</span>}
              {source && <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-secondary)' }}> • Source: {source}</span>}
            </h2>
          </div>

          {/* Review Mode Selector */}
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '15px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setReviewMode('study')}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'study' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                  color: reviewMode === 'study' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'study' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Study
              </button>
              <button
                onClick={() => {
                  console.log('Switching to browse mode');
                  setReviewMode('browse');
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'browse' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                  color: reviewMode === 'browse' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'browse' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Browse
              </button>
              <button
                onClick={() => {
                  console.log('Switching to appreciation mode');
                  setReviewMode('appreciation');
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'appreciation' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                  color: reviewMode === 'appreciation' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'appreciation' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Appreciation
              </button>
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              {reviewMode === 'study' && 'Standard spaced repetition. Only shows cards due for review. Cards are scheduled based on your performance.'}
              {reviewMode === 'browse' && 'Review all learned cards without affecting scheduling. Cards ordered by when they would appear in study mode.'}
              {reviewMode === 'appreciation' && 'View all learned cards in random order for enjoyment or deeper understanding, without any memorization pressure.'}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1>All Done!</h1>
            <p style={{ fontSize: '18px', color: 'var(--dark-text)', margin: '30px 0' }}>
              {getMessage()}
            </p>
            {reviewMode === 'study' && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '20px 0' }}>
                Try switching to Browse or Appreciation mode to review your learned cards.
              </p>
            )}
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: 'var(--accent)',
                color: 'var(--cream)',
                border: '3px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Review
              {topic && <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-secondary)' }}> • Topic: {topic}</span>}
              {source && <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-secondary)' }}> • Source: {source}</span>}
            </h2>
            <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={includeToEdit}
              onChange={(e) => setIncludeToEdit(e.target.checked)}
            />
            Include "to edit" cards
          </label>
        </div>

        {/* Review Mode Selector */}
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            justifyContent: 'center',
          }}>
            <button
              onClick={() => setReviewMode('study')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: reviewMode === 'study' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                color: reviewMode === 'study' ? 'white' : 'var(--text-primary)',
                border: reviewMode === 'study' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Study
            </button>
            <button
              onClick={() => setReviewMode('browse')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: reviewMode === 'browse' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                color: reviewMode === 'browse' ? 'white' : 'var(--text-primary)',
                border: reviewMode === 'browse' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Browse
            </button>
            <button
              onClick={() => setReviewMode('appreciation')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: reviewMode === 'appreciation' ? 'var(--blue-button)' : 'var(--bg-secondary)',
                color: reviewMode === 'appreciation' ? 'white' : 'var(--text-primary)',
                border: reviewMode === 'appreciation' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Appreciation
            </button>
          </div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: '1.5',
          }}>
            {reviewMode === 'study' && 'Standard spaced repetition. Only shows cards due for review. Cards are scheduled based on your performance.'}
            {reviewMode === 'browse' && 'Review all learned cards without affecting scheduling. Cards ordered by when they would appear in study mode.'}
            {reviewMode === 'appreciation' && 'View all learned cards in random order for enjoyment or deeper understanding, without any memorization pressure.'}
          </p>
        </div>

      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: '12px',
        padding: '40px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>{currentCard.title}</h3>

          {currentCard.image_data && (
            <div style={{ marginBottom: '20px' }}>
              <ImageWithClozes
                imageData={currentCard.image_data}
                clozes={currentCard.image_clozes || []}
                hideClozes={!showAnswer}
                alt={currentCard.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '4px',
                  display: 'block',
                }}
              />
            </div>
          )}

          {currentCard.content && (
            <div style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {renderMixedContent(currentCard.content, !showAnswer)}
            </div>
          )}

          {showAnswer && (
            <>
              {currentCard.source && (
                <div style={{
                  marginTop: '30px',
                  padding: '15px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {currentCard.source}
                  </p>
                  {currentCard.author && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {currentCard.author}
                    </p>
                  )}
                  {(currentCard.page || currentCard.timestamp) && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {currentCard.page && `Page ${currentCard.page}`}
                      {currentCard.page && currentCard.timestamp && ' • '}
                      {currentCard.timestamp}
                    </p>
                  )}
                  {currentCard.url && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                      <a href={currentCard.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-button)', textDecoration: 'underline' }}>
                        {currentCard.url}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {currentCard.why_made_this && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}>
                  <strong>Note:</strong> {currentCard.why_made_this}
                </div>
              )}

              {currentCard.created_at && (
                <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created: {new Date(currentCard.created_at).toLocaleDateString()}
                </p>
              )}

              {currentCard.topics && currentCard.topics.length > 0 && (
                <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentCard.topics.map((topic) => (
                    <span
                      key={topic.id}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#e5e7eb',
                        color: 'var(--text-primary)',
                        borderRadius: '15px',
                        fontSize: '14px',
                      }}
                    >
                      {topic.name}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{
                  padding: '3px 10px',
                  backgroundColor: '#e5e7eb',
                  color: 'var(--text-secondary)',
                  borderRadius: '10px',
                }}>
                  {currentCard.type}
                </span>
                {currentCard.to_edit && (
                  <span style={{
                    padding: '3px 10px',
                    backgroundColor: 'var(--hard-orange)',
                    color: 'white',
                    borderRadius: '10px',
                  }}>
                    To Edit
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              padding: '15px',
              fontSize: '18px',
              backgroundColor: 'var(--text-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Show Answer
          </button>
        ) : reviewMode === 'study' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <button
              onClick={() => handleRate(0)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: 'var(--again-red)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Again
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>1 day</div>
            </button>

            <button
              onClick={() => handleRate(2)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: 'var(--hard-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Hard
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>1-3 days</div>
            </button>

            <button
              onClick={() => handleRate(3.5)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: 'var(--good-green)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Good
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>3-6 days</div>
            </button>

            <button
              onClick={() => handleRate(5)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: 'var(--easy-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Easy
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>6+ days</div>
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            style={{
              padding: '15px',
              fontSize: '18px',
              backgroundColor: 'var(--blue-button)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Next
          </button>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
        <p>Tip: Focus on understanding, not just memorizing. Mark cards as "to edit" if you want to revise them later.</p>
      </div>
      </div>
    </div>
  );
}

export default Review;
