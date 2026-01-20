# FINAL Solution for macOS Shortcuts Quick Action

## The Problem
- Adding a keyboard shortcut automatically makes it a Quick Action
- Quick Actions receive rich text as temporary RTF files
- We need to convert the RTF file to plain text

## ✅ THE DEFINITIVE SOLUTION

### Your Shortcut Actions (in order):

1. **Receive**
   - Apps and 18 more from Share Sheet, Quick Actions
   - If there's no input: Get Clipboard

2. **Run Shell Script**
   - Shell: `/bin/bash`
   - Input: Shortcut Input
   - Pass input: **as arguments**
   - Script (copy exactly):

```bash
#!/bin/bash
export PATH="/usr/local/bin:$PATH"

# Debug logging
echo "=== $(date) ===" >> /tmp/snippet-shortcut.log
echo "Received: '$1'" >> /tmp/snippet-shortcut.log
echo "Is file? $(test -f "$1" && echo yes || echo no)" >> /tmp/snippet-shortcut.log

TEXT=""

# Method 1: If it's an RTF file, convert it
if [[ -f "$1" ]] && [[ "$1" == *".rtf" ]]; then
    echo "Converting RTF file..." >> /tmp/snippet-shortcut.log
    TEXT=$(textutil -convert txt -stdout "$1" 2>/dev/null)
    echo "Converted text length: ${#TEXT}" >> /tmp/snippet-shortcut.log
fi

# Method 2: If empty, try reading as plain text file
if [[ -z "$TEXT" ]] && [[ -f "$1" ]]; then
    echo "Reading as plain file..." >> /tmp/snippet-shortcut.log
    TEXT=$(cat "$1" 2>/dev/null)
fi

# Method 3: If still empty, try clipboard
if [[ -z "$TEXT" ]]; then
    echo "Trying clipboard..." >> /tmp/snippet-shortcut.log
    TEXT=$(pbpaste 2>/dev/null)
fi

# Method 4: Last resort - use argument as-is
if [[ -z "$TEXT" ]]; then
    echo "Using argument..." >> /tmp/snippet-shortcut.log
    TEXT="$1"
fi

echo "Final text: '$TEXT'" >> /tmp/snippet-shortcut.log
echo "Text length: ${#TEXT}" >> /tmp/snippet-shortcut.log

# Save to snippet
if [[ -n "$TEXT" ]]; then
    OUTPUT=$(snippet save "$TEXT" 2>&1)
    echo "Snippet result: $OUTPUT" >> /tmp/snippet-shortcut.log

    if [[ "$OUTPUT" == *"✅"* ]]; then
        osascript -e 'display notification "Snippet saved!" with title "Success"'
    else
        osascript -e "display notification \"$OUTPUT\" with title \"Error\""
    fi
else
    echo "ERROR: No text captured" >> /tmp/snippet-shortcut.log
    osascript -e 'display notification "No text to save" with title "Error"'
fi
```

### Settings Checklist:
- ✅ Shell: `/bin/bash`
- ✅ Input: Shortcut Input
- ✅ Pass input: as arguments
- ✅ Run as Administrator: UNCHECKED
- ✅ In right panel: "Use as Quick Action" enabled (automatic)
- ✅ In right panel: "Services Menu" checked
- ✅ Keyboard shortcut: Globe+S (or your preference)

---

## Testing

1. **Select some text** in any app (browser, Notes, etc.)
2. **Press Globe+S** (or right-click → Services → Save to Snippet)
3. **Check the log**:
   ```bash
   tail -20 /tmp/snippet-shortcut.log
   ```

The log will show you:
- What was received (file path or text)
- Whether it's a file
- What method was used to extract text
- The final text that was saved
- The result from snippet CLI

---

## If It Still Doesn't Work

Share the output of:
```bash
tail -30 /tmp/snippet-shortcut.log
```

And I'll diagnose exactly what's happening.

---

## Why This Works

1. **textutil** is macOS's built-in tool for converting RTF to plain text
2. We try multiple methods in order: RTF conversion → file read → clipboard → argument
3. Detailed logging shows exactly what's happening at each step
4. Notification shows success/error

This should handle ALL cases where Quick Actions pass data.
