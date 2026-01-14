import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { snippetAPI, topicAPI, aiAPI } from '../api/client';
import { renderMixedContent } from '../utils/latex';
import Header from '../components/Header';

function Library() {
  const [searchParams] = useSearchParams();
  const [snippets, setSnippets] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'created_at',
    order: 'desc',
    inQueue: '',
    toEdit: '',
    topic: '',
    source: '',
  });
  const [loading, setLoading] = useState(true);
  const [selectedSnippets, setSelectedSnippets] = useState([]);
  const [bulkOperation, setBulkOperation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);

  useEffect(() => {
    loadTopics();

    // Read URL params and set filters
    const topicParam = searchParams.get('topic');
    const sourceParam = searchParams.get('source');
    if (topicParam || sourceParam) {
      setFilters(prev => ({
        ...prev,
        topic: topicParam || '',
        source: sourceParam || '',
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    loadSnippets();
  }, [filters]);

  const loadTopics = async () => {
    try {
      const response = await topicAPI.getAll();
      setTopics(response.data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const loadSnippets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.order) params.order = filters.order;
      if (filters.inQueue) params.inQueue = filters.inQueue;
      if (filters.toEdit) params.toEdit = filters.toEdit;
      if (filters.topic) params.topic = filters.topic;
      if (filters.source) params.source = filters.source;

      const response = await snippetAPI.getAll(params);
      setSnippets(response.data);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      try {
        await snippetAPI.delete(id);
        setSnippets(snippets.filter(s => s.id !== id));
      } catch (error) {
        alert('Failed to delete snippet');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedSnippets.length === snippets.length) {
      setSelectedSnippets([]);
    } else {
      setSelectedSnippets(snippets.map(s => s.id));
    }
  };

  const toggleSelectSnippet = (id) => {
    if (selectedSnippets.includes(id)) {
      setSelectedSnippets(selectedSnippets.filter(sid => sid !== id));
    } else {
      setSelectedSnippets([...selectedSnippets, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSnippets.length) return;
    if (!confirm(`Delete ${selectedSnippets.length} snippet(s)?`)) return;

    try {
      await Promise.all(selectedSnippets.map(id => snippetAPI.delete(id)));
      setSnippets(snippets.filter(s => !selectedSnippets.includes(s.id)));
      setSelectedSnippets([]);
      setBulkOperation('');
    } catch (error) {
      alert('Failed to delete some snippets');
    }
  };

  const handleBulkUpdate = async (updates) => {
    if (!selectedSnippets.length) return;

    try {
      await Promise.all(
        selectedSnippets.map(id => {
          const snippet = snippets.find(s => s.id === id);
          return snippetAPI.update(id, { ...snippet, ...updates });
        })
      );
      await loadSnippets();
      setSelectedSnippets([]);
      setBulkOperation('');
    } catch (error) {
      alert('Failed to update some snippets');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      loadSnippets();
      return;
    }

    setIsSearching(true);
    try {
      if (useSemanticSearch) {
        // AI-powered semantic search
        const response = await aiAPI.search(searchQuery);
        setSnippets(response.data.results);
      } else {
        // Regular text search - fetch all snippets and filter client-side
        const params = {};
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.order) params.order = filters.order;
        if (filters.inQueue) params.inQueue = filters.inQueue;
        if (filters.toEdit) params.toEdit = filters.toEdit;
        if (filters.topic) params.topic = filters.topic;
        if (filters.source) params.source = filters.source;

        const response = await snippetAPI.getAll(params);
        const allSnippets = response.data;

        // Filter snippets by search query (case-insensitive)
        const query = searchQuery.toLowerCase();
        const filtered = allSnippets.filter(snippet => {
          const titleMatch = snippet.title?.toLowerCase().includes(query);
          const contentMatch = snippet.content?.toLowerCase().includes(query);
          const sourceMatch = snippet.source?.toLowerCase().includes(query);
          const topicsMatch = snippet.topics?.some(t => t.name.toLowerCase().includes(query));

          return titleMatch || contentMatch || sourceMatch || topicsMatch;
        });

        setSnippets(filtered);
      }
      setIsSearchMode(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Search failed';
      alert(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    loadSnippets();
  };

  return (
    <div>
      <Header />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Snippet Library</h1>
          {snippets.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedSnippets.length === snippets.length && snippets.length > 0}
                onChange={toggleSelectAll}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Select All</span>
            </label>
          )}
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={useSemanticSearch
                ? "Search with natural language (e.g., 'notes about quantum mechanics')"
                : "Search by title, content, source, or topics"}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#FFF',
                borderRadius: '4px',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: useSemanticSearch ? '#8b5cf6' : 'var(--blue-button)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isSearching || !searchQuery.trim() ? 0.6 : 1,
              }}
            >
              {isSearching ? 'Searching...' : '🔍 Search'}
            </button>
            {isSearchMode && (
              <button
                onClick={clearSearch}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: 'var(--text-secondary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isSearchMode
                ? `Found ${snippets.length} result${snippets.length === 1 ? '' : 's'} for "${searchQuery}"`
                : useSemanticSearch
                  ? 'AI-powered semantic search understands natural language queries'
                  : 'Text search filters by title, content, source, and topics'}
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={useSemanticSearch}
                onChange={(e) => setUseSemanticSearch(e.target.checked)}
              />
              <span style={{ color: 'var(--text-primary)' }}>Semantic Search</span>
            </label>
          </div>
        </div>

        {selectedSnippets.length > 0 && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--blue-button)',
            borderRadius: '8px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {selectedSnippets.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
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
              Delete
            </button>
            <button
              onClick={() => handleBulkUpdate({ inQueue: true })}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--blue-button)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Add to Queue
            </button>
            <button
              onClick={() => handleBulkUpdate({ inQueue: false })}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--text-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Remove from Queue
            </button>
            <button
              onClick={() => handleBulkUpdate({ toEdit: true })}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--hard-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Mark To Edit
            </button>
            <button
              onClick={() => handleBulkUpdate({ toEdit: false })}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--good-green)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Mark Complete
            </button>
            <button
              onClick={() => setBulkOperation('addTopic')}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--text-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Add Topic
            </button>
          </div>
        )}

        {bulkOperation === 'addTopic' && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#f9fafb',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
          }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Add Topic to {selectedSnippets.length} snippet(s):
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                id="bulkTopicSelect"
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: '#FFF',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select a topic...</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.name}>{topic.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const select = document.getElementById('bulkTopicSelect');
                  const topicName = select.value;
                  if (topicName) {
                    selectedSnippets.forEach(async (id) => {
                      const snippet = snippets.find(s => s.id === id);
                      const existingTopics = snippet.topics.map(t => t.name);
                      if (!existingTopics.includes(topicName)) {
                        await snippetAPI.update(id, {
                          ...snippet,
                          topics: [...existingTopics, topicName]
                        });
                      }
                    });
                    loadSnippets();
                    setSelectedSnippets([]);
                    setBulkOperation('');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: 'var(--green-button)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Apply
              </button>
              <button
                onClick={() => setBulkOperation('')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
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
          </div>
        )}

      <div style={{
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: '8px',
        marginBottom: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="created_at">Date Created</option>
            <option value="updated_at">Date Modified</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Order</label>
          <select
            value={filters.order}
            onChange={(e) => setFilters({ ...filters, order: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>In Queue</label>
          <select
            value={filters.inQueue}
            onChange={(e) => setFilters({ ...filters, inQueue: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>To Edit</label>
          <select
            value={filters.toEdit}
            onChange={(e) => setFilters({ ...filters, toEdit: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Topic</label>
          <select
            value={filters.topic}
            onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#FFF',
              borderRadius: '4px',
            }}
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.name}>{topic.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : snippets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-primary)' }}>
          <p>No snippets found</p>
          <Link
            to="/snippet/new"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: 'var(--green-button)',
              color: 'white',
              border: 'none',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Create Your First Snippet
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: selectedSnippets.includes(snippet.id) ? '2px solid var(--blue-button)' : '2px solid var(--border-color)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={selectedSnippets.includes(snippet.id)}
                    onChange={() => toggleSelectSnippet(snippet.id)}
                    style={{
                      cursor: 'pointer',
                      marginTop: '4px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{snippet.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#e5e7eb',
                      color: 'var(--text-secondary)',
                      borderRadius: '10px',
                      marginRight: '8px',
                    }}>
                      {snippet.type}
                    </span>
                    {snippet.in_queue && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--blue-button)',
                        color: 'white',
                        borderRadius: '10px',
                        marginRight: '8px',
                      }}>
                        In Queue
                      </span>
                    )}
                    {snippet.needs_work && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--hard-orange)',
                        color: 'white',
                        borderRadius: '10px',
                      }}>
                        To Edit
                      </span>
                    )}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/snippet/${snippet.id}/edit`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: 'var(--text-primary)',
                      color: 'white',
                      border: 'none',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(snippet.id)}
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
                    Delete
                  </button>
                </div>
              </div>

              {snippet.image_data && (
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={snippet.image_data}
                    alt={snippet.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              {snippet.content && (
                <p style={{ margin: '10px 0', color: 'var(--text-primary)' }}>
                  {snippet.content
                    .replace(/\{\{c\d+::(.*?)\}\}/g, '$1') // Show cloze answers
                    .replace(/==/g, '') // Remove highlight markers
                    .replace(/\$\$(.*?)\$\$/gs, '$1') // Remove math delimiters for preview
                    .substring(0, 200)}
                  {snippet.content.length > 200 && '...'}
                </p>
              )}

              {snippet.source && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '5px 0' }}>
                  <strong>Source:</strong> {snippet.source}
                </p>
              )}

              {snippet.topics && snippet.topics.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {snippet.topics.map((topic) => (
                    <span
                      key={topic.id}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#e5e7eb',
                        color: 'var(--text-primary)',
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    >
                      {topic.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default Library;
