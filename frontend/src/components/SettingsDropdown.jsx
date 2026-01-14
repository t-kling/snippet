import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { snippetAPI, reviewAPI } from '../api/client';
import { useSettings, FONTS } from '../contexts/SettingsContext';

function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme, font, showWhyMadeThis, toggleTheme, changeFont, toggleShowWhyMadeThis } = useSettings();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await snippetAPI.exportLibrary();
      const data = response.data;

      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snippet-library-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsOpen(false);
      alert(`Exported ${data.snippets.length} snippets successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export library');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setIsOpen(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.snippets || !Array.isArray(data.snippets)) {
        throw new Error('Invalid file format');
      }

      const response = await snippetAPI.importLibrary(data);
      alert(`Imported ${response.data.importedCount} of ${response.data.totalAttempted} snippets successfully!`);

      // Reload the page to show imported snippets
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import library. Please check the file format.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearSpacedRepetition = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to do this? All cards will be marked as new and all spaced repetition history will be cleared.'
    );

    if (!confirmed) return;

    setClearing(true);
    try {
      const response = await reviewAPI.clearData();
      alert(`Spaced repetition data cleared! ${response.data.cardsReset} card(s) reset to new.`);
      setIsOpen(false);
    } catch (error) {
      console.error('Clear data error:', error);
      alert('Failed to clear spaced repetition data.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: 'transparent',
          color: '#ffffff',
          border: '2px solid #ffffff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ⚙️ Settings
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '240px',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: '8px 0' }}>
            {/* Theme Toggle */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                APPEARANCE
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{theme === 'light' ? '☀️' : '🌙'}</span>
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>

            {/* Font Selector */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                FONT
              </div>
              <select
                value={font}
                onChange={(e) => changeFont(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {Object.values(FONTS).map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor Options */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                EDITOR
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  checked={showWhyMadeThis}
                  onChange={toggleShowWhyMadeThis}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  Show "Why I Made This" field
                </span>
              </label>
            </div>

            {/* Stats Link */}
            <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => {
                  navigate('/stats');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>📊</span>
                View Statistics
              </button>
            </div>

            {/* Import/Export */}
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', margin: '8px 16px' }}>
                DATA
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>⬇️</span>
                {exporting ? 'Exporting...' : 'Download Library'}
              </button>

              <button
                onClick={handleImportClick}
                disabled={importing}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>⬆️</span>
                {importing ? 'Importing...' : 'Upload Library'}
              </button>

              <button
                onClick={handleClearSpacedRepetition}
                disabled={clearing}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--again-red)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: clearing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>🔄</span>
                {clearing ? 'Clearing...' : 'Clear Spaced Repetition Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default SettingsDropdown;
