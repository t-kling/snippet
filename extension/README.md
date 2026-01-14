# Snippet Browser Extension

Chrome extension for quickly saving web content to your Snippet spaced repetition library.

## Features

- **Quick Save**: Right-click selected text → "Quick Save to Snippet" (instant save with toast notification)
- **Full Edit**: Right-click selected text → "Save & Edit Snippet" (popup with full editing, cloze support)
- **Image Save**: Right-click any image → "Save Image to Snippet"
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+Q` (Cmd+Shift+Q on Mac): Quick Save
  - `Ctrl+Shift+S` (Cmd+Shift+S on Mac): Full Edit
  - `Ctrl+Shift+C` (Cmd+Shift+C on Mac): Create cloze in popup

## Installation for Development

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension/` directory from this project
5. The extension is now installed!

### 2. Configure API URL

The extension is pre-configured to use `http://localhost:5001` for the API.

To use production API instead:
1. Open `extension/utils/api.js`
2. Update the `production` URL in `API_URLS`
3. Change `API_BASE_URL` default to `API_URLS.production`

### 3. Login

1. Click the extension icon (bookmark) in Chrome toolbar
2. Login with your Snippet account credentials
3. Your session will persist across browser restarts

## Usage

### Quick Save (Fastest)
1. Select text on any webpage
2. Right-click → **Quick Save to Snippet**
3. A toast notification confirms the save
4. That's it! The snippet is in your account

### Full Edit (With Cloze Support)
1. Select text on any webpage
2. Right-click → **Save & Edit Snippet**
3. Popup opens with editable form
4. Select text in the content area and press `Ctrl+Shift+C` to create cloze deletions
5. Customize title, type, topics, priority
6. Click **Save Snippet**

### Save Images
1. Right-click any image on a webpage
2. Select **Save Image to Snippet**
3. Popup opens with image preview
4. Confirm and save

## Development

### File Structure

```
extension/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Context menus, keyboard shortcuts, API calls
├── content/
│   ├── content-script.js   # Injected into web pages, handles toasts
│   └── toast.css           # Toast notification styles
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
├── utils/
│   ├── api.js              # API client
│   └── url-cleaner.js      # URL tracking parameter removal
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Debugging

**Popup**: Right-click extension icon → **Inspect** → Opens DevTools for popup

**Background Script**:
1. Go to `chrome://extensions/`
2. Find "Snippet Saver"
3. Click **Details**
4. Click **Inspect views: service worker**

**Content Script**:
1. Open any webpage
2. Press `F12` for DevTools
3. Content script logs appear in console

### Reload After Changes

After editing code:
1. Go to `chrome://extensions/`
2. Click the **refresh icon** on Snippet Saver
3. Test your changes

## Features Implemented

- ✅ Context menu for text selection (Quick Save & Full Edit)
- ✅ Context menu for images
- ✅ Keyboard shortcuts
- ✅ Toast notifications
- ✅ Login/authentication with JWT
- ✅ URL tracking parameter cleanup
- ✅ Character limit enforcement (6000 chars)
- ✅ Cloze deletion support in popup (Ctrl/Cmd+Shift+C)
- ✅ Topic autocomplete suggestions
- ✅ Auto-generate titles
- ✅ Dark mode support
- ✅ Source URL and page title capture

## Known Limitations

- Chrome only (Firefox support requires minor manifest adjustments)
- Images must be under 300KB
- Text snippets limited to ~1000 words (6000 chars)
- Emojis in icons may not render perfectly on all systems

## Next Steps

1. Test Quick Save on various websites
2. Test Full Edit with cloze creation
3. Test image saving
4. Verify login persistence
5. Test keyboard shortcuts
6. Check toast notifications appear correctly

## Publishing to Chrome Web Store

When ready to publish:

1. Create icons (current placeholders work but consider professional design)
2. Update `manifest.json` with final version number
3. Update API URL to production in `utils/api.js`
4. Create ZIP of extension directory
5. Create Chrome Web Store developer account ($5)
6. Upload ZIP and submit for review
7. Review typically takes 2-3 days

## Troubleshooting

**"Not authenticated" error**: Click extension icon and login

**Toast doesn't appear**: Check if content script loaded (inspect page console)

**Context menu missing**: Extension may need reload at `chrome://extensions/`

**Popup doesn't open**: Check for JavaScript errors (right-click icon → Inspect)

**API calls fail**: Verify backend is running and CORS is enabled

## License

MIT (same as main Snippet project)
