import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { reviewAPI, snippetAPI } from '../api/client';
import Header from '../components/Header';
import { useSettings } from '../contexts/SettingsContext';
import { CardContent, PriorityControls, RatingButtons } from '../components/ReviewLayouts';

// Shared mode description helper
const getModeDescription = (mode) => {
  switch(mode) {
    case 'study': return 'Standard spaced repetition. Only cards due for review.';
    case 'browse': return 'Review all learned cards without affecting scheduling.';
    case 'appreciation': return 'View all learned cards in random order for enjoyment.';
    default: return '';
  }
};

function Review() {
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [includeToEdit, setIncludeToEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState('study'); // 'study', 'browse', 'appreciation'
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const navigate = useNavigate();
  const { reviewLayout } = useSettings();

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

  const handlePriorityChange = async (newPriority) => {
    if (updatingPriority || !currentCard) return;

    setUpdatingPriority(true);
    try {
      await snippetAPI.update(currentCard.id, { priority: newPriority });

      // Update the priority in the local state
      setCards(prevCards => {
        const updatedCards = [...prevCards];
        updatedCards[currentIndex] = { ...updatedCards[currentIndex], priority: newPriority };
        return updatedCards;
      });
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    } finally {
      setUpdatingPriority(false);
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
        <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
          {/* Left Sidebar */}
          <div style={{
            width: '280px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '24px' }}>
                Review
              </h2>
              {topic && <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Topic: {topic}</p>}
              {source && <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Source: {source}</p>}
            </div>

            {/* Study Mode Selector */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                MODE
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setReviewMode('study')}
                  style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: reviewMode === 'study' ? 'var(--blue-button)' : 'var(--bg-primary)',
                    color: reviewMode === 'study' ? 'white' : 'var(--text-primary)',
                    border: reviewMode === 'study' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  Study
                </button>
                <button
                  onClick={() => setReviewMode('browse')}
                  style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: reviewMode === 'browse' ? 'var(--blue-button)' : 'var(--bg-primary)',
                    color: reviewMode === 'browse' ? 'white' : 'var(--text-primary)',
                    border: reviewMode === 'browse' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  Browse
                </button>
                <button
                  onClick={() => setReviewMode('appreciation')}
                  style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: reviewMode === 'appreciation' ? 'var(--blue-button)' : 'var(--bg-primary)',
                    color: reviewMode === 'appreciation' ? 'white' : 'var(--text-primary)',
                    border: reviewMode === 'appreciation' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  Appreciation
                </button>
              </div>
              <p style={{
                margin: '12px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.4',
              }}>
                {reviewMode === 'study' && 'Standard spaced repetition. Only cards due for review.'}
                {reviewMode === 'browse' && 'Review all learned cards without affecting scheduling.'}
                {reviewMode === 'appreciation' && 'View all learned cards in random order for enjoyment.'}
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, maxWidth: '900px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h1>All Done!</h1>
            <p style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '30px 0' }}>
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

  // Render different layouts based on setting
  const renderLayout = () => {
    const commonProps = {
      currentCard,
      currentIndex,
      cards,
      showAnswer,
      setShowAnswer,
      reviewMode,
      setReviewMode,
      handleRate,
      handleNext,
      handlePriorityChange,
      updatingPriority,
      submitting,
      navigate,
      topic,
      source,
    };

    switch (reviewLayout) {
      case 'topbar':
        return renderTopBarLayout(commonProps);
      case 'floating':
        return renderFloatingLayout(commonProps);
      case 'balanced':
        return renderBalancedLayout(commonProps);
      case 'bottom':
        return renderBottomLayout(commonProps);
      default: // 'sidebar'
        return renderSidebarLayout(commonProps);
    }
  };

  // Sidebar Layout (Default)
  const renderSidebarLayout = ({ currentCard, currentIndex, cards, showAnswer, setShowAnswer, reviewMode, setReviewMode, handleRate, handleNext, handlePriorityChange, updatingPriority, submitting, navigate, topic, source }) => (
    <div>
      <Header />

      <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Sidebar */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Review Info */}
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '24px' }}>
              Review
            </h2>
            {topic && <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Topic: {topic}</p>}
            {source && <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Source: {source}</p>}
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>

          {/* Study Mode Selector */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              MODE
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setReviewMode('study')}
                title={getModeDescription('study')}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'study' ? 'var(--blue-button)' : 'var(--bg-primary)',
                  color: reviewMode === 'study' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'study' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                Study
              </button>
              <button
                onClick={() => setReviewMode('browse')}
                title={getModeDescription('browse')}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'browse' ? 'var(--blue-button)' : 'var(--bg-primary)',
                  color: reviewMode === 'browse' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'browse' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                Browse
              </button>
              <button
                onClick={() => setReviewMode('appreciation')}
                title={getModeDescription('appreciation')}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: reviewMode === 'appreciation' ? 'var(--blue-button)' : 'var(--bg-primary)',
                  color: reviewMode === 'appreciation' ? 'white' : 'var(--text-primary)',
                  border: reviewMode === 'appreciation' ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                Appreciation
              </button>
            </div>
            <p style={{
              margin: '12px 0 0 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
            }}>
              {reviewMode === 'study' && getModeDescription('study')}
              {reviewMode === 'browse' && getModeDescription('browse')}
              {reviewMode === 'appreciation' && getModeDescription('appreciation')}
            </p>
          </div>

          {/* Edit Card Button */}
          <button
            onClick={() => navigate(`/snippet/${currentCard.id}/edit`)}
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--card-hover)';
              e.target.style.borderColor = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.borderColor = 'var(--border-color)';
            }}
          >
            ✏️ Edit This Card
          </button>
        </div>

        {/* Main Card Area */}
        <div style={{ flex: 1, maxWidth: '900px' }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '12px',
            padding: '40px',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div style={{ marginBottom: '30px' }}>
              <CardContent currentCard={currentCard} showAnswer={showAnswer} />
            </div>
            {showAnswer && <PriorityControls currentCard={currentCard} handlePriorityChange={handlePriorityChange} updatingPriority={updatingPriority} />}
            <RatingButtons reviewMode={reviewMode} submitting={submitting} handleRate={handleRate} handleNext={handleNext} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />
          </div>
        </div>
      </div>
    </div>
  );

  // Top Bar Layout - Centered card with controls above
  const renderTopBarLayout = ({ currentCard, currentIndex, cards, showAnswer, setShowAnswer, reviewMode, setReviewMode, handleRate, handleNext, handlePriorityChange, updatingPriority, submitting, navigate, topic, source }) => (
      <div>
        <Header />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          {/* Top control bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Review</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Card {currentIndex + 1} of {cards.length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['study', 'browse', 'appreciation'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setReviewMode(mode)}
                  title={getModeDescription(mode)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: reviewMode === mode ? 'bold' : 'normal',
                    backgroundColor: reviewMode === mode ? 'var(--blue-button)' : 'var(--bg-primary)',
                    color: reviewMode === mode ? 'white' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            <button
              onClick={() => navigate(`/snippet/${currentCard.id}/edit`)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
        {/* Card */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', padding: '40px', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ marginBottom: '30px' }}>
            <CardContent currentCard={currentCard} showAnswer={showAnswer} />
          </div>
          {showAnswer && <PriorityControls currentCard={currentCard} handlePriorityChange={handlePriorityChange} updatingPriority={updatingPriority} />}
          <RatingButtons reviewMode={reviewMode} submitting={submitting} handleRate={handleRate} handleNext={handleNext} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />
        </div>
      </div>
    </div>
  );

  // Floating Layout - Full width with minimal controls
  const renderFloatingLayout = ({ currentCard, currentIndex, cards, showAnswer, setShowAnswer, reviewMode, setReviewMode, handleRate, handleNext, handlePriorityChange, updatingPriority, submitting, navigate, topic, source }) => (
      <div>
        <Header />
        {/* Floating mode pills in top-right */}
        <div style={{ position: 'fixed', top: '140px', right: '20px', zIndex: 100, display: 'flex', gap: '8px' }}>
          {['study', 'browse', 'appreciation'].map(mode => (
            <button
              key={mode}
              onClick={() => setReviewMode(mode)}
              title={getModeDescription(mode)}
              style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: reviewMode === mode ? 'var(--blue-button)' : 'var(--bg-secondary)',
              color: reviewMode === mode ? 'white' : 'var(--text-primary)',
              border: '2px solid var(--border-color)',
              borderRadius: '20px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {mode}
          </button>
        ))}
      </div>
      {/* Card counter top-left */}
      <div style={{ position: 'fixed', top: '140px', left: '20px', zIndex: 100, padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
          {currentIndex + 1} / {cards.length}
        </p>
      </div>
      {/* Floating edit button */}
      <button
        onClick={() => navigate(`/snippet/${currentCard.id}/edit`)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 100,
          width: '56px',
          height: '56px',
          fontSize: '24px',
          backgroundColor: 'var(--blue-button)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        ✏️
      </button>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', padding: '40px', minHeight: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ marginBottom: '30px' }}>
            <CardContent currentCard={currentCard} showAnswer={showAnswer} />
          </div>
          {showAnswer && <PriorityControls currentCard={currentCard} handlePriorityChange={handlePriorityChange} updatingPriority={updatingPriority} />}
          <RatingButtons reviewMode={reviewMode} submitting={submitting} handleRate={handleRate} handleNext={handleNext} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />
        </div>
      </div>
    </div>
  );

  // Balanced Layout - Wider sidebar with metadata
  const renderBalancedLayout = ({ currentCard, currentIndex, cards, showAnswer, setShowAnswer, reviewMode, setReviewMode, handleRate, handleNext, handlePriorityChange, updatingPriority, submitting, navigate, topic, source }) => (
      <div>
        <Header />
        <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
          {/* Wider Sidebar with Metadata */}
          <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--text-primary)' }}>{currentCard.title}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>TYPE</p>
                  <span style={{ padding: '4px 10px', backgroundColor: '#e5e7eb', color: 'var(--text-secondary)', borderRadius: '10px', fontSize: '13px', textTransform: 'capitalize' }}>
                    {currentCard.type}
                  </span>
                </div>
                {currentCard.source && (
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>SOURCE</p>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{currentCard.source}</p>
                    {currentCard.author && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{currentCard.author}</p>}
                    {currentCard.page && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Page {currentCard.page}</p>}
                  </div>
                )}
                {currentCard.topics && currentCard.topics.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>TOPICS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {currentCard.topics.map(topic => (
                        <span key={topic.id} style={{ padding: '4px 10px', backgroundColor: '#e5e7eb', color: 'var(--text-primary)', borderRadius: '10px', fontSize: '12px' }}>
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>PROGRESS</p>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Card {currentIndex + 1} of {cards.length}</p>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${((currentIndex + 1) / cards.length) * 100}%`, height: '100%', backgroundColor: 'var(--blue-button)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>MODE</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['study', 'browse', 'appreciation'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setReviewMode(mode)}
                    title={getModeDescription(mode)}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: reviewMode === mode ? 'var(--blue-button)' : 'var(--bg-primary)',
                      color: reviewMode === mode ? 'white' : 'var(--text-primary)',
                      border: reviewMode === mode ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate(`/snippet/${currentCard.id}/edit`)}
              style={{
                padding: '14px',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ✏️ Edit This Card
            </button>
          </div>
          {/* Main Card Area */}
          <div style={{ flex: 1 }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', padding: '40px', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ marginBottom: '30px' }}>
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
                {showAnswer && currentCard.why_made_this && (
                  <div style={{
                    marginTop: '20px',
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
              </div>
              {showAnswer && <PriorityControls currentCard={currentCard} handlePriorityChange={handlePriorityChange} updatingPriority={updatingPriority} />}
              <RatingButtons reviewMode={reviewMode} submitting={submitting} handleRate={handleRate} handleNext={handleNext} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />
            </div>
          </div>
        </div>
      </div>
  );

  // Bottom Layout - Controls at bottom like mobile app
  const renderBottomLayout = ({ currentCard, currentIndex, cards, showAnswer, setShowAnswer, reviewMode, setReviewMode, handleRate, handleNext, handlePriorityChange, updatingPriority, submitting, navigate, topic, source }) => (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', padding: '40px', marginBottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent currentCard={currentCard} showAnswer={showAnswer} />
          </div>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Card {currentIndex + 1} / {cards.length}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['study', 'browse', 'appreciation'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setReviewMode(mode)}
                    title={getModeDescription(mode)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: reviewMode === mode ? 'var(--blue-button)' : 'var(--bg-primary)',
                      color: reviewMode === mode ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode.substring(0, 1).toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => navigate(`/snippet/${currentCard.id}/edit`)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ✏️
                </button>
              </div>
            </div>
            {showAnswer && <div style={{ marginBottom: '16px' }}><PriorityControls currentCard={currentCard} handlePriorityChange={handlePriorityChange} updatingPriority={updatingPriority} /></div>}
            <RatingButtons reviewMode={reviewMode} submitting={submitting} handleRate={handleRate} handleNext={handleNext} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />
          </div>
        </div>
      </div>
  );

  // Main return - calls the appropriate layout
  return renderLayout();
}

export default Review;
