import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { snippetAPI, reviewAPI } from '../api/client';
import { useSettings, FONTS } from '../contexts/SettingsContext';
import JSZip from 'jszip';

function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme, font, showWhyMadeThis, reviewLayout, toggleTheme, changeFont, toggleShowWhyMadeThis, changeReviewLayout } = useSettings();
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

      // Create a ZIP file
      const zip = new JSZip();

      // Add library.json (without embedded images)
      const libraryData = {
        version: data.version,
        exportedAt: data.exportedAt,
        snippets: data.snippets,
        topics: data.topics,
      };
      zip.file('library.json', JSON.stringify(libraryData, null, 2));

      // Add images to images/ folder
      if (data.images && Object.keys(data.images).length > 0) {
        const imagesFolder = zip.folder('images');
        for (const [filename, base64Data] of Object.entries(data.images)) {
          // Remove data:image/... prefix if present
          const base64Content = base64Data.includes(',')
            ? base64Data.split(',')[1]
            : base64Data;
          imagesFolder.file(filename, base64Content, { base64: true });
        }
      }

      // Generate ZIP and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snippet-library-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsOpen(false);
      const imageCount = Object.keys(data.images || {}).length;
      alert(`Exported ${data.snippets.length} snippets (${imageCount} with images) successfully!`);
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
      console.log('Step 1: Reading file...');
      let data;

      // Check if it's a ZIP file
      if (file.name.endsWith('.zip')) {
        console.log('Detected ZIP file, extracting...');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // Read library.json
        const libraryFile = zipContent.file('library.json');
        if (!libraryFile) {
          throw new Error('ZIP file must contain library.json');
        }
        const libraryText = await libraryFile.async('text');
        data = JSON.parse(libraryText);

        // Read images and attach them back to snippets
        const imagesFolder = zipContent.folder('images');
        if (imagesFolder) {
          const imageFiles = [];
          imagesFolder.forEach((relativePath, file) => {
            if (!file.dir) {
              imageFiles.push({ name: relativePath, file });
            }
          });

          // Load all images
          for (const { name, file } of imageFiles) {
            const base64 = await file.async('base64');
            // Find snippet(s) with this image_filename and restore image_data
            for (const snippet of data.snippets) {
              if (snippet.image_filename === name) {
                snippet.image_data = `data:image/png;base64,${base64}`;
                delete snippet.image_filename; // Clean up
              }
            }
          }
        }
      } else {
        // Handle old JSON format
        console.log('Detected JSON file');
        const text = await file.text();
        data = JSON.parse(text);
      }

      console.log('Step 2: Validating data...');
      console.log('Data has snippets?', !!data.snippets);
      console.log('Snippets is array?', Array.isArray(data.snippets));
      console.log('Number of snippets:', data.snippets?.length);
      console.log('Data has topics?', !!data.topics);
      console.log('Topics is array?', Array.isArray(data.topics));

      if (!data.snippets || !Array.isArray(data.snippets)) {
        console.error('Validation failed: snippets is not valid');
        throw new Error('Invalid file format - missing or invalid snippets array');
      }

      console.log('Step 3: Calling API to import...');
      const response = await snippetAPI.importLibrary(data);
      console.log('Import response:', response.data);

      let message = `Import complete!\n\nTotal: ${response.data.totalAttempted}`;
      message += `\nImported: ${response.data.importedCount - response.data.mergedCount}`;
      if (response.data.mergedCount > 0) {
        message += `\nMerged duplicates: ${response.data.mergedCount}`;
      }
      if (response.data.failedCount > 0) {
        message += `\nFailed: ${response.data.failedCount}`;
        if (response.data.errors && response.data.errors.length > 0) {
          message += `\n\nErrors:\n${response.data.errors.join('\n')}`;
        }
      }
      alert(message);

      // Reload the page to show imported snippets
      window.location.reload();
    } catch (error) {
      console.error('Import error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to import library. ';
      if (error.message.includes('JSON')) {
        errorMessage += 'File is not valid JSON.';
      } else if (error.message.includes('snippets')) {
        errorMessage += 'File format is invalid (missing snippets).';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.data?.error || error.response.statusText}`;
      } else {
        errorMessage += error.message || 'Please check the file format.';
      }

      alert(errorMessage);
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

            {/* Review Layout */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                REVIEW LAYOUT
              </div>
              <select
                value={reviewLayout}
                onChange={(e) => changeReviewLayout(e.target.value)}
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
                <option value="sidebar">Default</option>
                <option value="topbar">Centered with Top Bar</option>
                <option value="floating">Full Width with Minimal Controls</option>
                <option value="balanced">Sidebar with Metadata</option>
                <option value="bottom">Bottom Controls Bar</option>
              </select>
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
        accept="application/zip,.zip,application/json,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default SettingsDropdown;
