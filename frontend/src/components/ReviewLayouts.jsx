import { Link } from 'react-router-dom';
import { renderMixedContent } from '../utils/latex';
import ImageWithClozes from './ImageWithClozes';

// Shared card content component
export const CardContent = ({ currentCard, showAnswer }) => (
  <>
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
  </>
);

// Priority controls component
export const PriorityControls = ({ currentCard, handlePriorityChange, updatingPriority }) => (
  <div style={{
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
  }}>
    <div style={{
      fontSize: '13px',
      fontWeight: 'bold',
      color: 'var(--text-secondary)',
      marginBottom: '10px',
      textAlign: 'center',
    }}>
      Priority
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
    }}>
      <button
        onClick={() => handlePriorityChange('low')}
        disabled={updatingPriority}
        style={{
          padding: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          backgroundColor: currentCard.priority === 'low' ? 'var(--text-secondary)' : 'var(--bg-secondary)',
          color: currentCard.priority === 'low' ? 'white' : 'var(--text-primary)',
          border: currentCard.priority === 'low' ? '2px solid var(--text-secondary)' : '2px solid var(--border-color)',
          borderRadius: '6px',
          cursor: updatingPriority ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: updatingPriority ? 0.6 : 1,
        }}
      >
        Low
      </button>
      <button
        onClick={() => handlePriorityChange('medium')}
        disabled={updatingPriority}
        style={{
          padding: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          backgroundColor: currentCard.priority === 'medium' ? 'var(--blue-button)' : 'var(--bg-secondary)',
          color: currentCard.priority === 'medium' ? 'white' : 'var(--text-primary)',
          border: currentCard.priority === 'medium' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
          borderRadius: '6px',
          cursor: updatingPriority ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: updatingPriority ? 0.6 : 1,
        }}
      >
        Medium
      </button>
      <button
        onClick={() => handlePriorityChange('high')}
        disabled={updatingPriority}
        style={{
          padding: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          backgroundColor: currentCard.priority === 'high' ? 'var(--accent)' : 'var(--bg-secondary)',
          color: currentCard.priority === 'high' ? 'white' : 'var(--text-primary)',
          border: currentCard.priority === 'high' ? '2px solid var(--accent)' : '2px solid var(--border-color)',
          borderRadius: '6px',
          cursor: updatingPriority ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: updatingPriority ? 0.6 : 1,
        }}
      >
        High
      </button>
    </div>
  </div>
);

// Rating buttons component
export const RatingButtons = ({ reviewMode, submitting, handleRate, handleNext, showAnswer, setShowAnswer }) => {
  if (!showAnswer) {
    return (
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
    );
  }

  if (reviewMode === 'study') {
    return (
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
    );
  }

  return (
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
  );
};
