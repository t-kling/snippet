# Browser Extension Design Plan

A browser extension for quickly capturing web content as Snippet cards.

## Overview

The browser extension allows users to save snippets directly from any webpage without switching to the main app. It captures selected text, page metadata, and creates properly formatted cards that sync with the user's account.

## Core Features

### 1. Text Capture (Two Flows)

**Quick Save Flow**: Right-click selected text → "Quick Save to Snippet"
- Instant save with zero additional clicks
- Auto-generates title from selection
- Auto-sets type to "excerpt", priority to "medium"
- Shows 2-second toast notification: "Snippet saved!"
- No popup interruption
- Keyboard shortcut: `Ctrl+Shift+Q` (Q for Quick)

**Full Edit Flow**: Right-click selected text → "Save & Edit Snippet"
- Opens popup window for full editing
- Pre-filled with selection and metadata
- Add cloze deletions with Ctrl/Cmd+Shift+C
- Customize title, type, topics, priority
- Review before saving
- Keyboard shortcut: `Ctrl+Shift+S` (S for Save)

### 2. Image Capture
- **Right-click any image** → "Save Image to Snippet"
- Downloads and converts image to base64
- Checks 300KB size limit
- Opens small confirmation popup with metadata
- Auto-title: "Image from [domain]"
- Separate from text selection to avoid UI clutter

### 3. Automatic Metadata Capture
When saving a snippet, automatically capture:
- **URL**: Full webpage URL as source
- **Title**: Page title or user-editable title
- **Author**: Extract from meta tags or user input
- **Date/Time**: Timestamp of capture
- **Selection Context**: Paragraph before/after for reference

### 4. Extension Popup Interface (Full Edit Mode)
Small popup window (400x600px) with:
```
┌─────────────────────────────────┐
│ 🔖 Snippet                      │
├─────────────────────────────────┤
│ Selected Text:                  │
│ [Preview of selected text...]   │
│                                 │
│ Title: [Auto-filled or edit]    │
│                                 │
│ Type: ○ Excerpt                 │
│       ○ Revised                 │
│       ○ Original                │
│                                 │
│ Topics: [_____________] [+]     │
│         [tag1] [tag2]           │
│                                 │
│ Priority: ○ Low ● Med ○ High    │
│                                 │
│ ☑ Add to Queue                  │
│ ☐ Mark To Edit                  │
│                                 │
│ [Cancel] [Save Snippet]         │
└─────────────────────────────────┘
```

**Quick Save Toast Notification:**
```
┌────────────────────────────┐
│ ✓ Snippet saved!           │
│ "Selected text begi..."    │
└────────────────────────────┘
```
(Appears bottom-right, fades after 2 seconds)

### 5. Authentication
- **Login State**: Store JWT token securely
- **Auto-login**: Persist login across browser sessions
- **Sync with Web App**: Share authentication state
- **Login Flow**: Open popup to login if not authenticated

### 6. Context Menu Structure
Right-click menu when text is selected:
```
┌──────────────────────────────┐
│ Snippet                   ▶  │
├──────────────────────────────┤
│   Quick Save to Snippet      │
│   Save & Edit Snippet        │
└──────────────────────────────┘
```

Right-click menu on images:
```
┌──────────────────────────────┐
│ Snippet                   ▶  │
├──────────────────────────────┤
│   Save Image to Snippet      │
└──────────────────────────────┘
```

### 7. Minimal Features for MVP
- Save selected text as excerpt
- Capture URL and page title
- Add topics
- Set priority
- Toggle "Add to Queue"
- Direct save to user account via API

## Technical Architecture

### Extension Structure
```
extension/
├── manifest.json           # Extension config (Manifest V3)
├── background/
│   └── service-worker.js   # Background tasks, API calls
├── content/
│   └── content-script.js   # Inject into web pages, handle selection
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── utils/
    └── api.js              # API client for backend
```

### Manifest V3 Configuration
```json
{
  "manifest_version": 3,
  "name": "Snippet Saver",
  "version": "1.0.0",
  "description": "Quick-save web content to your Snippet spaced repetition library",
  "permissions": [
    "activeTab",
    "contextMenus",
    "storage"
  ],
  "host_permissions": [
    "https://your-snippet-api.com/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icon-16.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },
  "commands": {
    "save-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Save selected text to Snippet"
    }
  }
}
```

### Data Flow
```
1. User selects text on webpage
2. User triggers save (right-click, hotkey, or extension icon)
3. Content script captures:
   - Selected text
   - Page URL
   - Page title
   - Author (if available from meta tags)
4. Popup opens with pre-filled data
5. User confirms/edits:
   - Snippet type (excerpt/revised/original)
   - Topics
   - Priority
   - Queue status
6. Background service worker makes API call:
   POST /api/snippets
   {
     title: "Page Title",
     type: "excerpt",
     content: "Selected text...",
     source: "https://example.com/article",
     author: "Author Name",
     url: "https://example.com/article",
     topics: ["topic1", "topic2"],
     priority: "medium",
     inQueue: true
   }
7. Show success notification
8. Clear form or close popup
```

## Advanced Features (Future)

### Smart Content Extraction
- **Article Mode**: Detect and extract main article content using readability algorithms
- **Code Snippets**: Automatically detect and format code blocks with syntax highlighting
- **Images**: Option to include images from the page
- **Tables**: Preserve table formatting when saving

### Batch Saving
- Select multiple text snippets from same page
- Queue them for review before saving
- Bulk topic assignment

### Offline Support
- Queue snippets when offline
- Sync when connection restored
- Show sync status in popup

### Browser Sync
- Sync extension settings across devices
- Recently used topics
- Saved searches

### Quick Edit
- Edit recently saved snippets directly from extension
- View today's due cards in popup
- Quick review mode for 1-3 cards

## Design Considerations

### User Experience
1. **Minimal Friction**: Saving should take 2-3 clicks maximum
2. **Smart Defaults**: Auto-detect type based on selection (quoted text = excerpt)
3. **Keyboard Friendly**: Full keyboard navigation in popup
4. **Visual Feedback**: Clear success/error states
5. **Non-Intrusive**: No overlay or permanent UI on webpages

### Privacy & Security
1. **No Tracking**: Extension doesn't track browsing history
2. **Secure Storage**: JWT tokens stored in chrome.storage.local (encrypted)
3. **Minimal Permissions**: Only request necessary permissions
4. **User Control**: Clear data export and deletion options

### Performance
1. **Lightweight**: Extension should add <1MB to browser
2. **Fast Saves**: API calls should complete in <500ms
3. **Lazy Loading**: Only load popup UI when needed
4. **Efficient Content Script**: Minimal impact on page load

### Cross-Browser Compatibility
- **Chrome**: Primary target (uses Manifest V3)
- **Firefox**: Compatible with minimal changes (Manifest V2/V3 hybrid)
- **Edge**: Uses Chrome extension store
- **Safari**: Requires separate implementation (Swift-based)

## Implementation Phases

### Phase 1: MVP (Week 1-2)
- [ ] Basic extension structure with Manifest V3
- [ ] Content script for text selection
- [ ] Simple popup UI with form
- [ ] API integration for saving snippets
- [ ] Authentication with JWT storage
- [ ] Context menu integration
- [ ] Chrome support only

### Phase 2: Enhanced UX (Week 3)
- [ ] Keyboard shortcut support
- [ ] Topic autocomplete from user's existing topics
- [ ] Recent topics quick-select
- [ ] Success/error notifications
- [ ] Loading states
- [ ] Form validation

### Phase 3: Smart Features (Week 4+)
- [ ] Article content extraction
- [ ] Auto-detect snippet type
- [ ] Image capture options
- [ ] Batch saving UI
- [ ] Firefox compatibility
- [ ] Extension settings page

### Phase 4: Advanced (Future)
- [ ] Offline queueing
- [ ] Quick review in popup
- [ ] Edit recent snippets
- [ ] Browser sync
- [ ] Safari version

## Design Decisions

### 1. Image Handling ✓
- **Text by default**: Standard text selection → text-only snippet
- **Right-click images**: Separate context menu item "Save Image to Snippet"
- **Single images only**: Avoids complexity of UI elements and unwanted images
- **Size limit**: Same 300KB limit as main app
- **Conversion**: Download image → convert to base64 → save

### 2. Two Save Flows ✓
**Quick Save**: Right-click → "Quick Save to Snippet"
- Instant save with minimal interaction
- Auto-generates title from first 50 chars
- Auto-sets type to "excerpt"
- Default priority "medium"
- Shows brief toast notification
- Perfect for shallow reading/casual browsing

**Full Edit**: Right-click → "Save & Edit Snippet"
- Opens popup window (400x600px)
- Full editing interface with cloze creation support
- Add topics, set priority, edit content
- Keyboard shortcut for cloze: Ctrl/Cmd+Shift+C
- Perfect for deep study and immediate cloze creation

### 3. URL Handling ✓
- **Truncate long URLs**: Display first 60 chars + "..." in UI
- **Store full URL**: Backend receives complete URL
- **Smart cleanup**: Strip common tracking parameters:
  - `utm_*` (Google Analytics)
  - `fbclid` (Facebook)
  - `gclid` (Google Ads)
  - `ref`, `referrer`, `source`
- **Example**: `https://example.com/article?utm_source=twitter&utm_campaign=promo`
  → Stores as `https://example.com/article`

### 4. Multi-Selection ✓
- **Each selection = separate snippet**
- If user selects multiple regions, they save each one individually
- Encourage focused, atomic snippets
- Keeps snippet creation simple and fast

### 5. Content Length Limit ✓
- **Maximum ~1000 words** (~5000-6000 characters)
- Show character counter in Full Edit popup
- Soft limit: Warning at 5000 chars
- Hard limit: Can't save over 6000 chars
- Prevents misuse while supporting legitimate long captures

### 6. Popup Windows ✓
- **Use extension popup** for Full Edit flow
- No popup blocker issues (extensions have special privileges)
- Must be triggered by user gesture (guaranteed by right-click)
- Faster and more integrated than opening new tabs

### 7. Dark Mode ✓
- Match main app's color scheme
- Use CSS variables for consistency
- Auto-detect system preference as fallback
- Low priority - users unlikely to care strongly

## Distribution

### Chrome Web Store
- Create developer account ($5 one-time fee)
- Submit extension for review
- Privacy policy required
- Regular updates for security

### Firefox Add-ons
- Free submission
- AMO (addons.mozilla.org) review process
- Can submit same codebase with minor changes

### Self-Hosting
- Option to install from GitHub
- For users who prefer not using stores
- Include installation instructions

## Success Metrics

- **Adoption**: % of users who install extension
- **Usage**: Average snippets saved per week via extension
- **Retention**: % of users still using extension after 30 days
- **Performance**: Average time from selection to save
- **Errors**: Failed save rate (target: <1%)

## Getting Started with Extension Development

### Recommended Project Structure
```
snippet/
├── backend/
├── frontend/
└── extension/          # New directory for extension
    ├── manifest.json
    ├── background/
    │   └── service-worker.js
    ├── content/
    │   ├── content-script.js
    │   └── toast.css
    ├── popup/
    │   ├── popup.html
    │   ├── popup.js
    │   └── popup.css
    ├── utils/
    │   ├── api.js
    │   └── url-cleaner.js
    └── assets/
        ├── icon-16.png
        ├── icon-48.png
        └── icon-128.png
```

### Development Workflow

**1. Create Extension Directory**
```bash
mkdir extension
cd extension
```

**2. Create manifest.json**
Start with basic manifest, add features incrementally

**3. Load Unpacked Extension in Chrome**
- Open `chrome://extensions/`
- Enable "Developer mode" (top right)
- Click "Load unpacked"
- Select your `extension/` folder
- Extension is now installed for testing

**4. Development Cycle**
```
1. Edit code
2. Go to chrome://extensions/
3. Click refresh icon on your extension
4. Test on a webpage
5. Check console for errors (right-click extension → "Inspect popup")
```

**5. Debugging**
- **Popup**: Right-click extension icon → Inspect
- **Background script**: chrome://extensions → Details → Inspect service worker
- **Content script**: Regular browser DevTools (F12) on any page
- **Console.log()** is your friend!

### Key APIs You'll Use

**chrome.contextMenus** - Add right-click menu items
```javascript
chrome.contextMenus.create({
  id: "quick-save",
  title: "Quick Save to Snippet",
  contexts: ["selection"]
});
```

**chrome.storage.local** - Store JWT token
```javascript
// Save
chrome.storage.local.set({ jwtToken: "..." });

// Retrieve
chrome.storage.local.get(['jwtToken'], (result) => {
  console.log(result.jwtToken);
});
```

**chrome.runtime.sendMessage** - Content ↔ Background communication
```javascript
// From content script
chrome.runtime.sendMessage({
  action: "saveSnippet",
  data: { text: "...", url: "..." }
});

// In background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveSnippet") {
    // Make API call
    saveToAPI(request.data);
  }
});
```

**fetch()** - Make API calls (in background script)
```javascript
fetch('https://your-api.com/api/snippets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(snippetData)
});
```

### Testing Checklist
- [ ] Quick save creates snippet correctly
- [ ] Full edit popup opens and saves
- [ ] Image right-click works
- [ ] URL tracking parameters stripped
- [ ] Toast notification appears and disappears
- [ ] Keyboard shortcuts work
- [ ] Login persists across browser restart
- [ ] Character limit enforced
- [ ] Cloze creation works in popup

### Common Pitfalls to Avoid
1. **Content Security Policy**: No inline `<script>` in HTML. All JS must be in external files.
2. **Message passing**: Content scripts can't directly call background functions - must use sendMessage.
3. **Async/await**: Most Chrome APIs use callbacks, not promises (but you can promisify them).
4. **Permissions**: Request minimum necessary permissions or users will be suspicious.
5. **CORS**: API calls from extension are subject to CORS - make sure your backend allows it.

## Notes

- Extension should feel like natural part of browsing workflow
- Prioritize speed and simplicity over advanced features
- Consider user privacy and data security at every step
- Make extension optional but powerful addition to main app
- Start simple: Get Quick Save working first, then add Full Edit mode
- Chrome Web Store submission takes ~3 days for review
