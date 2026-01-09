import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { snippetAPI, topicAPI } from '../api/client';
import { insertCloze } from '../utils/cloze';

function SnippetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: 'excerpt',
    source: '',
    content: '',
    topics: [],
    inQueue: true,
    needsWork: false,
  });

  const [topicInput, setTopicInput] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTopics();
    if (isEditing) {
      loadSnippet();
    }
  }, [id]);

  useEffect(() => {
    // Filter topic suggestions
    if (topicInput) {
      const filtered = availableTopics
        .filter(t => t.name.toLowerCase().includes(topicInput.toLowerCase()))
        .filter(t => !formData.topics.includes(t.name))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [topicInput, availableTopics, formData.topics]);

  const loadTopics = async () => {
    try {
      const response = await topicAPI.getAll();
      setAvailableTopics(response.data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const loadSnippet = async () => {
    try {
      const response = await snippetAPI.getById(id);
      const snippet = response.data;
      setFormData({
        title: snippet.title || '',
        type: snippet.type,
        source: snippet.source || '',
        content: snippet.content,
        topics: snippet.topics.map(t => t.name),
        inQueue: snippet.in_queue,
        needsWork: snippet.needs_work,
      });
    } catch (error) {
      setError('Failed to load snippet');
    }
  };

  const handleClozeShortcut = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd } = textarea;

      if (selectionStart !== selectionEnd) {
        const newContent = insertCloze(formData.content, selectionStart, selectionEnd);
        setFormData({ ...formData, content: newContent });

        // Restore cursor position
        setTimeout(() => {
          textarea.focus();
          const newPosition = selectionStart + newContent.length - formData.content.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }
  };

  const addTopic = (topicName) => {
    if (topicName && !formData.topics.includes(topicName)) {
      setFormData({ ...formData, topics: [...formData.topics, topicName] });
      setTopicInput('');
      setSuggestions([]);
    }
  };

  const removeTopic = (topicName) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(t => t !== topicName),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        clozeData: [], // Cloze data is stored in content string
      };

      if (isEditing) {
        await snippetAPI.update(id, payload);
      } else {
        await snippetAPI.create(payload);
      }

      navigate('/library');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save snippet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>{isEditing ? 'Edit Snippet' : 'Create New Snippet'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Auto-generated if left blank"
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>

        <div>
          <label htmlFor="type" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          >
            <option value="excerpt">Excerpt (direct quote)</option>
            <option value="revised">Revised (paraphrased/simplified)</option>
            <option value="original">Original (your own ideas)</option>
          </select>
        </div>

        {(formData.type === 'excerpt' || formData.type === 'revised') && (
          <div>
            <label htmlFor="source" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Source</label>
            <input
              id="source"
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Book title, URL, or other source"
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
        )}

        <div>
          <label htmlFor="content" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Content
          </label>
          <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>
            Select text and press Ctrl+Shift+C (or Cmd+Shift+C on Mac) to create cloze deletion
          </small>
          <textarea
            id="content"
            ref={textareaRef}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            onKeyDown={handleClozeShortcut}
            required
            rows={10}
            style={{ width: '100%', padding: '8px', fontSize: '14px', fontFamily: 'monospace' }}
          />
        </div>

        <div>
          <label htmlFor="topics" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Topics</label>
          <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {formData.topics.map((topic) => (
              <span
                key={topic}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '15px',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(topic)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 5px',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="topics"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topicInput) {
                  e.preventDefault();
                  addTopic(topicInput);
                }
              }}
              placeholder="Add topic and press Enter"
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '2px',
                zIndex: 10,
              }}>
                {suggestions.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => addTopic(topic.name)}
                    style={{
                      padding: '8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {topic.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.inQueue}
              onChange={(e) => setFormData({ ...formData, inQueue: e.target.checked })}
            />
            <span>In review queue</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.needsWork}
              onChange={(e) => setFormData({ ...formData, needsWork: e.target.checked })}
            />
            <span>Needs work</span>
          </label>
        </div>

        {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Snippet'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/library')}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SnippetEditor;
