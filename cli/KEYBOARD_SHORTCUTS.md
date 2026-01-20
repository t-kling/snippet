# Setting Up Keyboard Shortcuts for Snippet CLI

This guide shows you how to set up system-wide keyboard shortcuts to save selected text or screenshots to Snippet from anywhere on your Mac.

## Prerequisites

1. Install and configure the CLI:
```bash
cd cli
npm link
snippet config
```

When running `snippet config`, you'll be asked for:

- **API URL**:
  - For production: `https://snippet-api.vercel.app/api`
  - For local development: `http://localhost:5001/api`

- **JWT Token**: Get this from your logged-in session:
  - Open Snippet web app in browser and login
  - Open Developer Tools (F12) → Console
  - Run: `localStorage.getItem('jwtToken')`
  - Copy the token (without quotes) and paste it

---

## Option 1: macOS Shortcuts App (Built-in, Free)

The easiest option using macOS's built-in Shortcuts app.

### For Selected Text

1. Open **Shortcuts** app (Spotlight: Cmd+Space → type "Shortcuts")

2. Click **"+"** to create new shortcut

3. Add these actions IN ORDER:
   - Search for **"Get Selected Items"** (or "Get Selected Text") and add it
     - This should be the FIRST action

   - Search for **"Run Shell Script"** and add it AFTER the first action
     - Shell: **`/bin/bash`**
     - In the script box, paste:
       ```bash
       export PATH="/usr/local/bin:$PATH"
       echo "$1" | snippet save
       ```
     - Change "Input" dropdown to **"Shortcut Input"**
     - Change "Pass input" to **"as arguments"**

5. Name your shortcut (e.g., "Save to Snippet")

6. Right-click the shortcut → **"Add Keyboard Shortcut"**
   - Suggestion: `Cmd+Shift+S` or `Ctrl+Shift+S`

7. In **System Settings → Privacy & Security → Shortcuts**:
   - Enable "Shortcuts" to control your computer

**Usage**: Select any text anywhere, press your keyboard shortcut

### For Screenshots

1. Take screenshot with **Cmd+Shift+5**

2. Click **"Done"** in the screenshot thumbnail

3. Click **"Share"** button → **"Shortcuts"**

4. Create a shortcut similar to above but with:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   snippet image "$1"
   ```

---

## Option 2: Keyboard Maestro (Paid - $36, Most Powerful)

If you want more control and reliability, Keyboard Maestro is excellent.

### Setup

1. Download from https://www.keyboardmaestro.com

2. Create new macro:
   - Name: "Save to Snippet"
   - Trigger: **"Hot Key"** → Choose your shortcut (e.g., `Ctrl+Shift+S`)

3. Add action: **"Execute Shell Script"**
   ```bash
   export PATH="/usr/local/bin:$PATH"
   echo "%CurrentClipboard%" | snippet save
   ```

4. Add action BEFORE the shell script: **"Copy"** (to copy selected text to clipboard)

### Better Version (preserves clipboard)

```bash
export PATH="/usr/local/bin:$PATH"
OLDCLIP="$(pbpaste)"
pbcopy
echo "$(pbpaste)" | snippet save
echo "$OLDCLIP" | pbcopy
```

This saves your selection without losing your clipboard.

---

## Option 3: BetterTouchTool (Paid - $22, Very Customizable)

Another powerful option with lots of features.

### Setup

1. Download from https://folivora.ai

2. Go to **Keyboard** tab → **Add New Shortcut**

3. Set your trigger key combination (e.g., `Cmd+Shift+S`)

4. Choose action: **"Execute Terminal Command (Synchronous)"**

5. Paste this command:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   SELECTED=$(osascript -e 'tell application "System Events" to keystroke "c" using command down' && sleep 0.1 && pbpaste)
   OLDCLIP=$(pbpaste)
   echo "$SELECTED" | snippet save
   echo "$OLDCLIP" | pbpaste
   ```

---

## Option 4: Automator Quick Action (Built-in, Free)

Create a Quick Action that appears in the Services menu.

### Setup

1. Open **Automator** app

2. Choose **"Quick Action"** (or "Service" on older macOS)

3. Configure:
   - "Workflow receives current" → **"text"**
   - "in" → **"any application"**

4. Add action: **"Run Shell Script"**
   - Shell: **/bin/bash**
   - Pass input: **as arguments**
   - Paste:
     ```bash
     export PATH="/usr/local/bin:$PATH"
     echo "$*" | snippet save
     ```

5. Save as "Save to Snippet"

6. In **System Settings → Keyboard → Keyboard Shortcuts → Services**:
   - Find "Save to Snippet" under "Text"
   - Click "Add Shortcut" and set your key combo

**Usage**: Select text, right-click → Services → Save to Snippet (or use keyboard shortcut)

---

## Option 5: Alfred Workflow (If you use Alfred)

If you have Alfred Powerpack:

1. Create new Workflow

2. Add **Hotkey** trigger

3. Add **Run Script** action:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   echo "{query}" | snippet save
   ```

4. Connect **Hotkey** to **Run Script**

---

## Testing Your Setup

1. Select some text anywhere (browser, Notes, etc.)
2. Press your keyboard shortcut
3. You should see a success message from the CLI

**Troubleshooting:**
- If it says "command not found", add `export PATH="/usr/local/bin:$PATH"` to your script
- Check that `snippet config` is properly set up
- Test the CLI directly first: `snippet save "test"`

---

## Recommended Setup

**For most users**: Use **macOS Shortcuts** (Option 1)
- Free
- Built into macOS
- Easy to set up
- Works reliably

**For power users**: Use **Keyboard Maestro** (Option 2)
- More reliable
- Better clipboard handling
- Can add conditional logic
- Worth the $36 if you automate a lot

---

## For Screenshots

The easiest way to save screenshots:

### Quick Method (No keyboard shortcut needed)

1. Take screenshot: **Cmd+Shift+4** (area) or **Cmd+Shift+3** (full screen)
2. Screenshot is saved to Desktop
3. Run: `snippet image ~/Desktop/Screen*.png` (saves latest screenshot)

### Automated Method

Create a folder action or launchd job that watches `~/Desktop` for new screenshots and auto-saves them. (Advanced - let me know if you want this!)

---

## Next Steps

After setting up:
1. Test with different apps to ensure it works everywhere
2. Remember: snippets are auto-queued if you're offline
3. Use `snippet help` to see all commands

Enjoy seamless snippet capture from anywhere! 🎉
