import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { snippetAPI, topicAPI } from '../api/client';
import { renderClozeVisible } from '../utils/cloze';

function Library() {
  const [snippets, setSnippets] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'created_at',
    order: 'desc',
    inQueue: '',
    needsWork: '',
    topic: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

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
      if (filters.needsWork) params.needsWork = filters.needsWork;
      if (filters.topic) params.topic = filters.topic;

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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Snippet Library</h1>
        <Link
          to="/"
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#007bff',
            textDecoration: 'none',
            border: '1px solid #007bff',
            borderRadius: '4px',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
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
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
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
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
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
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Needs Work</label>
          <select
            value={filters.needsWork}
            onChange={(e) => setFilters({ ...filters, needsWork: e.target.value })}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
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
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.name}>{topic.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
      ) : snippets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No snippets found</p>
          <Link
            to="/snippet/new"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
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
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{snippet.title}</h3>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '10px',
                      marginRight: '8px',
                    }}>
                      {snippet.type}
                    </span>
                    {snippet.in_queue && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#007bff',
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
                        backgroundColor: '#ffa500',
                        color: 'white',
                        borderRadius: '10px',
                      }}>
                        Needs Work
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/snippet/${snippet.id}/edit`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(snippet.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p style={{ margin: '10px 0', color: '#333' }}>
                {renderClozeVisible(snippet.content).substring(0, 200)}
                {snippet.content.length > 200 && '...'}
              </p>

              {snippet.source && (
                <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
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
                        backgroundColor: '#e8f4f8',
                        color: '#007bff',
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
  );
}

export default Library;
