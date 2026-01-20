# 10 Reasons Why Shortcut Is Saving File Path + Solutions to Test

## Issue: Getting "/Users/.../Clipboard...rtf" instead of actual text

---

## Reason 1: Clipboard Contains File Object, Not Text
**Problem:** macOS copied the selection as an RTF file reference
**Test:** Check what's in clipboard
**Solution:** Use "Get Text from Clipboard" instead of "Get Clipboard"

**Try This:**
1. Delete "Get Clipboard"
2. Add action: "Get Text from Clipboard" (not just "Get Clipboard")
3. Run Shell Script (same as before)

---

## Reason 2: Pass Input Method Is Wrong
**Problem:** "as arguments" passes file path as string, not file contents
**Test:** Change to stdin
**Solution:** Pass input "to stdin" instead of "as arguments"

**Try This:**
Keep Get Clipboard, but change Run Shell Script:
- Input: Shortcut Input
- Pass input: **to stdin** (change from "as arguments")
- Script:
```bash
export PATH="/usr/local/bin:$PATH"
read -r text
snippet save "$text"
osascript -e 'display notification "Saved!" with title "Success"'
```

---

## Reason 3: Need to Explicitly Convert to Plain Text
**Problem:** Clipboard has rich text, need plain text
**Solution:** Add a conversion step

**Try This:**
1. Get Clipboard
2. **Get Text from Input** (add this action)
3. Run Shell Script

---

## Reason 4: File Needs to Be Read
**Problem:** Shortcuts is passing a File object that needs reading
**Solution:** Check if input is a file and read it

**Try This - Updated Script:**
```bash
export PATH="/usr/local/bin:$PATH"

# Check if $1 is a file path
if [[ -f "$1" ]]; then
  # It's a file - read its contents
  TEXT=$(cat "$1")
else
  # It's already text
  TEXT="$1"
fi

snippet save "$TEXT"
osascript -e 'display notification "Saved!" with title "Success"'
```

---

## Reason 5: Services Menu Behavior Is Different
**Problem:** Services menu specifically creates temp files
**Solution:** Don't use Services menu - use Spotlight integration

**Try This:**
1. In your shortcut settings (right panel):
   - UNCHECK "Services Menu"
   - CHECK "Receive Input from Spotlight"
2. Test by selecting text, then:
   - Cmd+Space (Spotlight)
   - Type your shortcut name
   - Press Enter

---

## Reason 6: Need to Use AppleScript to Get Selection
**Problem:** Shortcuts can't reliably get selected text
**Solution:** Use AppleScript directly

**Try This - New Script:**
```bash
export PATH="/usr/local/bin:$PATH"

# Get selected text via AppleScript
SELECTED=$(osascript -e 'tell application "System Events" to keystroke "c" using command down' && sleep 0.2 && pbpaste)

snippet save "$SELECTED"
osascript -e 'display notification "Saved!" with title "Success"'
```

And change settings:
- Delete "Get Clipboard" action
- Just have Run Shell Script
- Input: (none)
- Pass input: (none)

---

## Reason 7: Shortcuts Automation Permission Issue
**Problem:** Shortcuts can't access clipboard properly
**Solution:** Grant full permissions

**Try This:**
1. System Settings → Privacy & Security → Automation
2. Find "Shortcuts" and enable everything
3. System Settings → Privacy & Security → Accessibility
4. Add "Shortcuts" if not there

---

## Reason 8: Using Wrong Shortcut Type
**Problem:** "Quick Action" treats input differently than regular shortcut
**Solution:** Create as different shortcut type

**Try This:**
Instead of editing current shortcut:
1. Create NEW shortcut (not Quick Action)
2. Don't add "Receive" action at all
3. Just add Run Shell Script with this:
```bash
export PATH="/usr/local/bin:$PATH"
# Copy selection to clipboard
osascript -e 'tell application "System Events" to keystroke "c" using command down'
sleep 0.3
# Get from clipboard
TEXT=$(pbpaste)
snippet save "$TEXT"
osascript -e 'display notification "Saved!" with title "Success"'
```
4. Assign keyboard shortcut Globe+S
5. Test by selecting text and pressing Globe+S (NOT via Services menu)

---

## Reason 9: RTF File Needs Textutil Conversion
**Problem:** .rtf file needs special tool to extract text
**Solution:** Use textutil command

**Try This - Updated Script:**
```bash
export PATH="/usr/local/bin:$PATH"

# Check if it's an RTF file
if [[ "$1" == *.rtf ]]; then
  # Convert RTF to plain text
  TEXT=$(textutil -convert txt -stdout "$1")
else
  TEXT="$1"
fi

snippet save "$TEXT"
osascript -e 'display notification "Saved!" with title "Success"'
```

---

## Reason 10: Clipboard Has Multiple Formats, Getting Wrong One
**Problem:** Clipboard has both file ref and text, getting file ref first
**Solution:** Force plain text extraction

**Try This - Most Reliable Script:**
```bash
export PATH="/usr/local/bin:$PATH"

# Method 1: Try to read as file first
if [[ -f "$1" && "$1" == *.rtf ]]; then
  TEXT=$(textutil -convert txt -stdout "$1" 2>/dev/null)
fi

# Method 2: If that failed, use clipboard directly
if [[ -z "$TEXT" ]]; then
  TEXT=$(pbpaste)
fi

# Method 3: If still empty, use the argument as-is
if [[ -z "$TEXT" ]]; then
  TEXT="$1"
fi

echo "Saving: $TEXT" >> /tmp/snippet-debug.log

snippet save "$TEXT"
osascript -e 'display notification "Saved!" with title "Success"'
```

---

## RECOMMENDED: Try These In Order

**Start with Solution #8** (Create new regular shortcut, not Quick Action)

If that doesn't work, try **Solution #10** (handles all cases)

If still not working, try **Solution #6** (direct AppleScript)

---

## Debug Command

After trying any solution, check what was saved:
```bash
cat /tmp/snippet-debug.log
```

This will show exactly what text was passed to snippet save.
