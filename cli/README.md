# Snippet CLI

Command-line tool for saving text and images to your Snippet library from anywhere on your system.

## Installation

```bash
cd cli
npm link
```

This will make the `snippet` command available globally on your system.

## Configuration

Before using, configure your API endpoint and authentication:

```bash
snippet config
```

You'll be prompted for:
- **API URL**: Your Snippet API endpoint (default: `http://localhost:5001/api`)
- **JWT Token**: Your authentication token (get this from your browser's localStorage after logging in to the web app)

Configuration is saved to `~/.snippet-cli.json`

## Usage

### Save Text

```bash
# Direct text
snippet save "This is some important text I want to remember"

# From clipboard (macOS)
pbpaste | snippet save

# From file
cat notes.txt | snippet save
```

### Save Images

```bash
snippet image ~/Desktop/screenshot.png
```

Images must be under 300KB and in PNG, JPG, GIF, or WebP format.

## Auto-Formatting

The CLI automatically improves long text blocks by adding sensible paragraph breaks:
- Text with existing paragraph breaks (double newlines) is preserved as-is
- Text with single newlines is preserved as-is
- Long text blocks (200+ chars) without line breaks are split into paragraphs of 2-4 sentences

## Offline Mode

The CLI works seamlessly offline:
- When you save a snippet without internet, it's queued locally in `~/.snippet-cli-queue.json`
- The next time you save a snippet with internet, all queued snippets are automatically synced
- You'll see status messages like:
  - `⚠️  No internet connection`
  - `📥 Saved to offline queue (will sync when online)`
  - `🔄 Syncing N queued snippet(s)...`
  - `✅ Synced N queued snippet(s)`

**Browser Extension**: The browser extension has the same offline functionality, storing failed saves in `chrome.storage.local` and auto-syncing when connection is restored.

## Integration with System Shortcuts

### macOS Shortcuts

Create a new Shortcut that:
1. Gets selected text or clipboard content
2. Runs Shell Script: `echo "$1" | /usr/local/bin/snippet save`

Assign a keyboard shortcut in System Preferences.

### Keyboard Maestro

Create a new macro:
1. Trigger: Your chosen hotkey
2. Action: Execute Shell Script with selected text as parameter
3. Script: `echo "$KMVAR_Instance__TriggerValue" | snippet save`

### BetterTouchTool

1. Create new keyboard shortcut
2. Action: Execute Terminal Command
3. Command: `pbpaste | snippet save`

### Screenshots

For saving screenshots directly from the screenshot editor (Cmd+Shift+5):
1. Take screenshot with Cmd+Shift+5
2. Click "Share" button
3. (Future: macOS Share Extension integration)

## Examples

```bash
# Quick save from anywhere
snippet save "Meeting notes: Discussed Q1 roadmap"

# Save code snippet
cat script.js | snippet save

# Save screenshot
snippet image ~/Desktop/diagram.png

# Help
snippet help
```

## Features

- ✅ Save text from command line
- ✅ Save images (PNG, JPG, GIF, WebP)
- ✅ Auto-generate titles from first 50 characters
- ✅ Auto-format long text with paragraph breaks
- ✅ Piped input support
- ✅ Local configuration
- ✅ Authentication with JWT
- ✅ **Offline support** - snippets are queued locally and synced when connection is restored

## Getting Your JWT Token

1. Open your Snippet web app in a browser
2. Log in
3. Open Developer Tools (F12)
4. Go to Console tab
5. Type: `localStorage.getItem('jwtToken')`
6. Copy the token (without quotes)
7. Use it in `snippet config`

## Future Enhancements

- macOS Share Extension for direct integration with screenshot editor
- Interactive mode for adding metadata (source, topics, etc.)
- Batch import from directories
- OCR support for images
