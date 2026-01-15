import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { snippetAPI, topicAPI, aiAPI } from '../api/client';
import { insertCloze, insertHighlight } from '../utils/cloze';
import { compressImage } from '../utils/imageCompression';
import { insertMath } from '../utils/latex';
import ImageClozeEditor from '../components/ImageClozeEditor';
import Header from '../components/Header';
import { useSettings } from '../contexts/SettingsContext';

function SnippetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const isEditing = !!id;
  const { showWhyMadeThis } = useSettings();

  const [formData, setFormData] = useState({
    title: '',
    type: 'excerpt',
    source: '',
    content: '',
    topics: [],
    inQueue: true,
    toEdit: false,
    imageData: null,
    imageClozes: [],
    author: '',
    url: '',
    page: '',
    timestamp: '',
    whyMadeThis: '',
    parentSnippet: '',
    priority: 'medium',
  });

  const [topicInput, setTopicInput] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [showClozeEditor, setShowClozeEditor] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [topicSuggestionLoading, setTopicSuggestionLoading] = useState(false);
  const [clozeSuggestionLoading, setClozeSuggestionLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [sourceInfoExpanded, setSourceInfoExpanded] = useState(true);

  useEffect(() => {
    loadTopics();
    loadSources();
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

  useEffect(() => {
    // Filter source suggestions
    if (formData.source && formData.source.length > 0) {
      const filtered = availableSources
        .filter(s => s.toLowerCase().includes(formData.source.toLowerCase()))
        .slice(0, 5);
      setSourceSuggestions(filtered);
    } else {
      setSourceSuggestions([]);
    }
  }, [formData.source, availableSources]);

  const loadTopics = async () => {
    try {
      const response = await topicAPI.getAll();
      setAvailableTopics(response.data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const loadSources = async () => {
    try {
      const response = await snippetAPI.getSources();
      setAvailableSources(response.data);
    } catch (error) {
      console.error('Failed to load sources:', error);
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
        toEdit: snippet.needs_work,
        imageData: snippet.image_data || null,
        imageClozes: snippet.image_clozes || [],
        author: snippet.author || '',
        url: snippet.url || '',
        page: snippet.page || '',
        timestamp: snippet.timestamp || '',
        whyMadeThis: snippet.why_made_this || '',
        parentSnippet: snippet.parent_snippet || '',
        priority: snippet.priority || 'medium',
      });
    } catch (error) {
      setError('Failed to load snippet');
    }
  };

  const handleClozeShortcut = (e) => {
    // Cloze deletion: Ctrl+Shift+C
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

    // Highlight: Ctrl+Shift+H
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd } = textarea;

      if (selectionStart !== selectionEnd) {
        const newContent = insertHighlight(formData.content, selectionStart, selectionEnd);
        setFormData({ ...formData, content: newContent });

        // Restore cursor position
        setTimeout(() => {
          textarea.focus();
          const newPosition = selectionStart + newContent.length - formData.content.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }

    // Math: Ctrl+Shift+M
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd } = textarea;

      if (selectionStart !== selectionEnd) {
        const newContent = insertMath(formData.content, selectionStart, selectionEnd);
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

  const handleHighlightClick = () => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;

    if (selectionStart !== selectionEnd) {
      const newContent = insertHighlight(formData.content, selectionStart, selectionEnd);
      setFormData({ ...formData, content: newContent });

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPosition = selectionStart + newContent.length - formData.content.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleMathClick = () => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;

    if (selectionStart !== selectionEnd) {
      const newContent = insertMath(formData.content, selectionStart, selectionEnd);
      setFormData({ ...formData, content: newContent });

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPosition = selectionStart + newContent.length - formData.content.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setError('');

    try {
      const compressed = await compressImage(file);
      setFormData({ ...formData, imageData: compressed.dataUrl });
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageData: null, imageClozes: [] });
    setShowClozeEditor(false);
  };

  const handleOCR = async () => {
    if (!formData.imageData) return;

    setOcrLoading(true);
    try {
      const response = await aiAPI.ocr(formData.imageData);
      const extractedText = response.data.text;

      // Add extracted text to content
      if (extractedText) {
        setFormData({ ...formData, content: formData.content + (formData.content ? '\n\n' : '') + extractedText });
        alert('Text extracted successfully!');
      } else {
        alert('No text found in image.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to extract text from image';
      alert(errorMessage);
    } finally {
      setOcrLoading(false);
    }
  };

  const addTopic = (topicName) => {
    const trimmedName = topicName.trim();

    if (trimmedName && !formData.topics.includes(trimmedName)) {
      setFormData(prevData => {
        const newTopics = [...prevData.topics, trimmedName];
        return { ...prevData, topics: newTopics };
      });
      setTopicInput('');
      setSuggestions([]);
    }
  };

  const removeTopic = (topicName) => {
    setFormData(prevData => ({
      ...prevData,
      topics: prevData.topics.filter(t => t !== topicName),
    }));
  };

  const handleSuggestTopics = async () => {
    if (!formData.content) {
      alert('Please add some content first to generate topic suggestions.');
      return;
    }

    setTopicSuggestionLoading(true);
    try {
      const response = await aiAPI.suggestTopics(formData.content);
      const suggestedTopics = response.data.suggestions;

      if (suggestedTopics && suggestedTopics.length > 0) {
        // Add suggested topics that aren't already in the list
        const newTopics = suggestedTopics.filter(topic => !formData.topics.includes(topic));
        if (newTopics.length > 0) {
          setFormData({ ...formData, topics: [...formData.topics, ...newTopics] });
        } else {
          alert('All suggested topics are already added!');
        }
      } else {
        alert('No topic suggestions generated.');
      }
    } catch (error) {
      console.error('Topic suggestion error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate topic suggestions';
      alert(errorMessage);
    } finally {
      setTopicSuggestionLoading(false);
    }
  };

  const handleSuggestCloze = async () => {
    if (!formData.content) {
      alert('Please add some content first to generate cloze suggestions.');
      return;
    }

    setClozeSuggestionLoading(true);
    try {
      const response = await aiAPI.suggestCloze(formData.content);
      const suggestedKeywords = response.data.suggestions;

      if (suggestedKeywords && suggestedKeywords.length > 0) {
        // Find the highest existing cloze number
        const existingClozes = formData.content.match(/\{\{c(\d+)::/g) || [];
        const maxClozeNum = existingClozes.reduce((max, match) => {
          const num = parseInt(match.match(/\d+/)[0]);
          return num > max ? num : max;
        }, 0);

        // Apply cloze deletions to the suggested keywords in the content
        let newContent = formData.content;
        let clozeCount = 0;

        suggestedKeywords.forEach(keyword => {
          // Escape special regex characters in the keyword
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // Match the keyword only if it's not already inside a cloze deletion
          // Use negative lookahead to avoid matching text inside {{c...::...}}
          const regex = new RegExp(`\\b${escapedKeyword}\\b(?![^{]*}}})`, 'i');

          if (regex.test(newContent)) {
            const newClozeNum = maxClozeNum + clozeCount + 1;
            newContent = newContent.replace(regex, `{{c${newClozeNum}::${keyword}}}`);
            clozeCount++;
          }
        });

        if (clozeCount > 0) {
          setFormData({ ...formData, content: newContent });
          alert(`Added ${clozeCount} cloze deletion(s) to your content!`);
        } else {
          alert('Could not find suggested keywords in your content (or all were already clozed).');
        }
      } else {
        alert('No cloze keyword suggestions generated.');
      }
    } catch (error) {
      console.error('Cloze suggestion error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate cloze suggestions';
      alert(errorMessage);
    } finally {
      setClozeSuggestionLoading(false);
    }
  };

  const handleCleanupText = async () => {
    if (!formData.content) {
      alert('Please add some content first to clean up formatting.');
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await aiAPI.cleanupText(formData.content);
      const cleanedText = response.data.cleanedText;

      if (cleanedText) {
        setFormData({ ...formData, content: cleanedText });
        alert('Text formatting cleaned up! Review the changes and adjust if needed.');
      } else {
        alert('No changes needed - text looks good!');
      }
    } catch (error) {
      console.error('Text cleanup error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to clean up text formatting';
      alert(errorMessage);
    } finally {
      setCleanupLoading(false);
    }
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

  const handleMakeCopy = async () => {
    setError('');
    setLoading(true);

    try {
      // First, save the current snippet if we're editing
      if (isEditing) {
        const payload = {
          ...formData,
          clozeData: [],
        };
        await snippetAPI.update(id, payload);
      }

      // Create a copy with modified fields
      const copyPayload = {
        ...formData,
        title: formData.title ? `${formData.title} (copy)` : '(copy)',
        type: 'revised',
        parentSnippet: formData.title || '',
        clozeData: [],
      };

      const response = await snippetAPI.create(copyPayload);
      const newSnippetId = response.data.id;

      // Navigate to the edit screen for the new copy
      navigate(`/snippet/${newSnippetId}/edit`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create copy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>{isEditing ? 'Edit Snippet' : 'Create New Snippet'}</h1>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: '8px',
        padding: '30px',
      }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Card Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Auto-generated from content if left blank"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label htmlFor="type" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="excerpt">Excerpt (direct quote)</option>
            <option value="revised">Revised (paraphrased/simplified)</option>
            <option value="original">Original (your own ideas)</option>
          </select>
        </div>

        {/* Source Metadata Section */}
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
        }}>
          <div
            onClick={() => setSourceInfoExpanded(!sourceInfoExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: sourceInfoExpanded ? '15px' : '0',
              userSelect: 'none',
            }}
          >
            <span style={{
              marginRight: '8px',
              transition: 'transform 0.2s',
              transform: sourceInfoExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}>
              ▶
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Source Information</h3>
          </div>

          {sourceInfoExpanded && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="source" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Source Title {formData.type === 'excerpt' && <span style={{ color: 'var(--again-red)' }}>*</span>}
                </label>
            <div style={{ position: 'relative' }}>
              <input
                id="source"
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Book, article, or media title"
                required={formData.type === 'excerpt'}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: '#FFF',
                  borderRadius: '4px',
                }}
              />
              {sourceSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  marginTop: '2px',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {sourceSuggestions.map((source, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setFormData({ ...formData, source });
                        setSourceSuggestions([]);
                      }}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderBottom: index < sourceSuggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                    >
                      {source}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="parentSnippet" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Parent Snippet (optional)
            </label>
            <input
              id="parentSnippet"
              type="text"
              value={formData.parentSnippet}
              onChange={(e) => setFormData({ ...formData, parentSnippet: e.target.value })}
              placeholder="Title of original card if this is a copy"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#FFF',
                borderRadius: '4px',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
              Automatically filled when using "Make Copy Snippet"
            </small>
          </div>

          {/* Optional metadata fields - appear when source title is filled */}
          {formData.source && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="author" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Author (optional)
                </label>
                <input
                  id="author"
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: '#FFF',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="url" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  URL (optional)
                </label>
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: '#FFF',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="page" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Page (optional)
                  </label>
                  <input
                    id="page"
                    type="text"
                    value={formData.page}
                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                    placeholder="p. 42, ch. 3"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '2px solid var(--border-color)',
                      backgroundColor: '#FFF',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="timestamp" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Timestamp (optional)
                  </label>
                  <input
                    id="timestamp"
                    type="text"
                    value={formData.timestamp}
                    onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                    placeholder="12:34, 1:23:45"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '2px solid var(--border-color)',
                      backgroundColor: '#FFF',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </>
          )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="content" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Content {formData.imageData && <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(optional with image)</span>}
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <small style={{ color: 'var(--text-secondary)' }}>
              Ctrl+Shift+C: cloze | Ctrl+Shift+H: highlight | Ctrl+Shift+M: math
            </small>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSuggestCloze}
                disabled={clozeSuggestionLoading || !formData.content}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: clozeSuggestionLoading || !formData.content ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: clozeSuggestionLoading || !formData.content ? 0.6 : 1,
                }}
              >
                {clozeSuggestionLoading ? 'Suggesting...' : '✨ Auto-Cloze'}
              </button>
              <button
                type="button"
                onClick={handleCleanupText}
                disabled={cleanupLoading || !formData.content}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: cleanupLoading || !formData.content ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: cleanupLoading || !formData.content ? 0.6 : 1,
                }}
              >
                {cleanupLoading ? 'Cleaning...' : '🧹 Clean-Up'}
              </button>
              <button
                type="button"
                onClick={handleHighlightClick}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: '#fbbf24',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Highlight
              </button>
              <button
                type="button"
                onClick={handleMathClick}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Math
              </button>
            </div>
          </div>
          <textarea
            id="content"
            ref={textareaRef}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            onKeyDown={handleClozeShortcut}
            required={!formData.imageData}
            rows={10}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Image (optional)
          </label>
          {formData.imageData ? (
            <div style={{ marginTop: '10px' }}>
              {showClozeEditor ? (
                <ImageClozeEditor
                  imageData={formData.imageData}
                  clozes={formData.imageClozes}
                  onChange={(clozes) => setFormData({ ...formData, imageClozes: clozes })}
                />
              ) : (
                <img
                  src={formData.imageData}
                  alt="Snippet"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '4px',
                    display: 'block',
                    marginBottom: '10px',
                  }}
                />
              )}
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOCR}
                  disabled={ocrLoading}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: ocrLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {ocrLoading ? 'Extracting Text...' : '🔍 Extract Text (OCR)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClozeEditor(!showClozeEditor)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: showClozeEditor ? 'var(--good-green)' : 'var(--blue-button)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {showClozeEditor ? '✓ Done Editing Clozes' : 'Add Image Clozes'}
                  {formData.imageClozes.length > 0 && !showClozeEditor && ` (${formData.imageClozes.length})`}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: 'var(--again-red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove Image
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: '#FFF',
                  borderRadius: '4px',
                }}
              />
              {imageLoading && (
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '5px' }}>
                  Compressing image...
                </small>
              )}
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '5px' }}>
                Max 300KB. Images will be automatically compressed.
              </small>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="topics" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Topics
            <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '13px' }}>
              (Press Enter to add)
            </span>
          </label>
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
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#FFF',
                borderRadius: '4px',
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
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
                      borderBottom: '1px solid var(--border-color)',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  >
                    {topic.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSuggestTopics}
            disabled={topicSuggestionLoading || !formData.content}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              fontSize: '14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: topicSuggestionLoading || !formData.content ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: topicSuggestionLoading || !formData.content ? 0.6 : 1,
            }}
          >
            {topicSuggestionLoading ? 'Suggesting...' : '✨ Suggest Topics'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              checked={formData.toEdit}
              onChange={(e) => setFormData({ ...formData, toEdit: e.target.checked })}
            />
            <span>To edit</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="priority" style={{ fontWeight: 'bold' }}>Priority:</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#FFF',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {showWhyMadeThis && (
          <div>
            <label htmlFor="whyMadeThis" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Why I Made This (optional)
            </label>
            <textarea
              id="whyMadeThis"
              value={formData.whyMadeThis}
              onChange={(e) => setFormData({ ...formData, whyMadeThis: e.target.value })}
              placeholder="Personal note about why you created this card..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#FFF',
                borderRadius: '4px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        {error && <div style={{ color: 'var(--again-red)', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

        {isEditing && (
          <div>
            <button
              type="button"
              onClick={handleMakeCopy}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                backgroundColor: '#60a5fa',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Make Copy Snippet
            </button>
            <small style={{
              display: 'block',
              marginTop: '6px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              Use this to streamline complicated material or rephrase in your own words
            </small>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: 'var(--green-button)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
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
              color: 'var(--text-primary)',
              border: '2px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default SnippetEditor;
