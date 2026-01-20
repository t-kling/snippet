# Debugging macOS Shortcuts for Snippet CLI

## 10 Things That Could Be Wrong (And How to Test Them)

### 1. ❌ CLI Not Installed/Not in PATH

**Test:**
```bash
which snippet
```

**Expected:** `/usr/local/bin/snippet` or similar

**Fix if fails:**
```bash
cd /Users/tklinger/Vibecoding/snippet/cli
npm link
which snippet  # Verify it worked
```

---

### 2. ❌ CLI Not Configured

**Test:**
```bash
cat ~/.snippet-cli.json
```

**Expected:** Should show your API URL and token

**Fix if fails:**
```bash
snippet config
# Enter: https://snippet-pr6g.vercel.app/api
# Enter: [your token from localStorage.getItem('token')]
```

---

### 3. ❌ CLI Command Doesn't Work at All

**Test:**
```bash
echo "test snippet" | snippet save
```

**Expected:** Should save successfully or show error

**Fix if fails:** Check the error message, likely config or token issue

---

### 4. ❌ Keyboard Shortcut Conflict (Globe+S)

**Issue:** Globe+S might be taken by another app

**Fix:**
- In Shortcuts, try changing to `Cmd+Shift+S` instead
- Or check System Settings → Keyboard → Keyboard Shortcuts for conflicts

---

### 5. ❌ Shell Script Can't Find snippet Command

**Issue:** macOS Shortcuts runs in a limited environment

**Fix:** Update your shortcut script to:
```bash
export PATH="/usr/local/bin:/usr/local/lib/node_modules/.bin:$PATH"
echo "$1" | /usr/local/bin/snippet save
```

Use the FULL path to snippet (from `which snippet`)

---

### 6. ❌ No Output/Error Visibility

**Issue:** You can't see what's happening

**Fix:** Create a debug version that shows output:

Replace your script with:
```bash
export PATH="/usr/local/bin:$PATH"
RESULT=$(echo "$1" | snippet save 2>&1)
osascript -e "display notification \"$RESULT\" with title \"Snippet Save\""
```

This will show a notification with the output/error!

---

### 7. ❌ Input Not Being Passed Correctly

**Test:** Change script to:
```bash
export PATH="/usr/local/bin:$PATH"
osascript -e "display notification \"Got: $1\" with title \"Debug\""
```

Select text, run the shortcut. You should see what text was captured.

---

### 8. ❌ Shortcuts Doesn't Have Permission

**Check:**
- System Settings → Privacy & Security → Automation
- Make sure "Shortcuts" is allowed
- System Settings → Privacy & Security → Full Disk Access
- Add "Shortcuts" if not there

---

### 9. ❌ JWT Token Expired

**Test:**
```bash
# Check if token is valid
curl -H "Authorization: Bearer $(cat ~/.snippet-cli.json | grep jwtToken | cut -d'"' -f4)" \
  https://snippet-pr6g.vercel.app/api/snippets
```

**Expected:** Should return your snippets, not 401 error

**Fix:** Get a new token from production site and run `snippet config` again

---

### 10. ❌ Wrong Shell Setting

**Issue:** Shell should be `/bin/bash`, not just "bash..."

**Fix:** In the Run Shell Script action, make sure Shell dropdown says `/bin/bash` exactly

---

## RECOMMENDED: Debug Script Version

Replace your current script with this debug version:

```bash
#!/bin/bash
export PATH="/usr/local/bin:$PATH"

# Log to file for debugging
echo "=== $(date) ===" >> /tmp/snippet-debug.log
echo "Input received: $1" >> /tmp/snippet-debug.log
echo "PATH: $PATH" >> /tmp/snippet-debug.log
echo "Which snippet: $(which snippet)" >> /tmp/snippet-debug.log

# Try to save
OUTPUT=$(echo "$1" | snippet save 2>&1)
echo "Output: $OUTPUT" >> /tmp/snippet-debug.log

# Show notification
if [[ $OUTPUT == *"✅"* ]]; then
  osascript -e 'display notification "Snippet saved!" with title "Success"'
else
  osascript -e "display notification \"$OUTPUT\" with title \"Error\""
fi
```

Then after running the shortcut, check:
```bash
cat /tmp/snippet-debug.log
```

This will tell you EXACTLY what's happening!

---

## Quick Fix for Globe+S Not Working

The keyboard shortcut might not work because:
1. You need to grant Shortcuts permission to control your computer
2. Globe key shortcuts sometimes don't work in all contexts

**Try this instead:**
1. Select text
2. Right-click → Services → [Your Shortcut Name]
3. If that works, the issue is just the keyboard shortcut, not the script

**Alternative:** Use `Cmd+Shift+S` or `Ctrl+Shift+S` instead of Globe+S

---

## STEP-BY-STEP: Replace Your Current Script

1. In Shortcuts app, click on "Run Shell Script" action
2. Delete the current script
3. Paste the DEBUG script above
4. Make sure Shell is `/bin/bash`
5. Select some text in any app
6. Run via Services menu (right-click → Services)
7. You should see a notification
8. Check `/tmp/snippet-debug.log` for details

This will show you exactly what's failing!
