import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewAPI } from '../api/client';
import { renderClozeHidden, renderClozeVisible } from '../utils/cloze';

function Review() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [includeNeedsWork, setIncludeNeedsWork] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCards();
  }, [includeNeedsWork]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.getDue(includeNeedsWork.toString());
      setCards(response.data);
      setCurrentIndex(0);
      setShowAnswer(false);
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
      await reviewAPI.submit(currentCard.id, quality);

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
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

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h1>All Done!</h1>
        <p style={{ fontSize: '18px', color: '#666', margin: '30px 0' }}>
          No cards due for review right now.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '16px',
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Review</h2>
          <p style={{ margin: '5px 0', color: '#666' }}>
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={includeNeedsWork}
              onChange={(e) => setIncludeNeedsWork(e.target.checked)}
            />
            Include "needs work" cards
          </label>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#007bff',
              textDecoration: 'none',
              border: '1px solid #007bff',
              borderRadius: '4px',
            }}
          >
            Exit
          </Link>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '2px solid #ddd',
        borderRadius: '12px',
        padding: '40px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>{currentCard.title}</h3>

          <div style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {showAnswer ? renderClozeVisible(currentCard.content) : renderClozeHidden(currentCard.content)}
          </div>

          {showAnswer && (
            <>
              {currentCard.source && (
                <div style={{
                  marginTop: '30px',
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    <strong>Source:</strong> {currentCard.source}
                  </p>
                </div>
              )}

              {currentCard.topics && currentCard.topics.length > 0 && (
                <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentCard.topics.map((topic) => (
                    <span
                      key={topic.id}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#e8f4f8',
                        color: '#007bff',
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
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                }}>
                  {currentCard.type}
                </span>
                {currentCard.needs_work && (
                  <span style={{
                    padding: '3px 10px',
                    backgroundColor: '#ffa500',
                    color: 'white',
                    borderRadius: '10px',
                  }}>
                    Needs Work
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
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Show Answer
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <button
              onClick={() => handleRate(0)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Unfamiliar
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>1 day</div>
            </button>

            <button
              onClick={() => handleRate(2)}
              disabled={submitting}
              style={{
                padding: '15px 10px',
                fontSize: '16px',
                backgroundColor: '#ffa500',
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
                backgroundColor: '#28a745',
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
                backgroundColor: '#007bff',
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
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        <p>Tip: Focus on understanding, not just memorizing. Mark cards as "needs work" if you want to revise them later.</p>
      </div>
    </div>
  );
}

export default Review;
