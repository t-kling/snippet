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
- **API URL**:
  - Production: `https://snippet-pr6g.vercel.app/api`
  - Local development: `http://localhost:5001/api` (default)
- **JWT Token**: Your authentication token (see below)

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

**📖 See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for detailed setup instructions!**

Quick summary of options:
- **macOS Shortcuts** (Built-in, Free) - Easiest option
- **Keyboard Maestro** ($36) - Most powerful and reliable
- **BetterTouchTool** ($22) - Great for customization
- **Automator** (Built-in, Free) - Services menu integration
- **Alfred Workflow** (If you use Alfred Powerpack)

All methods let you press a keyboard shortcut to save selected text from anywhere on your Mac.

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

**IMPORTANT**: You must get the token from your **production** deployment, not localhost!

1. Go to your Vercel frontend deployment in a browser
   - URL: `https://snippet-flame-three.vercel.app`
   - (Or check your Vercel dashboard to find your frontend URL)
2. **Log in** to your account
3. Open Developer Tools (press **F12** or right-click → Inspect)
4. Go to **Console** tab
5. Type: `localStorage.getItem('token')`
6. You should see a long string like: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
7. Copy the token (without the surrounding quotes)
8. Use it in `snippet config`

**If you get `null`**: You're either not logged in, or you're on the wrong URL (localhost instead of production)

## Future Enhancements

- macOS Share Extension for direct integration with screenshot editor
- Interactive mode for adding metadata (source, topics, etc.)
- Batch import from directories
- OCR support for images
