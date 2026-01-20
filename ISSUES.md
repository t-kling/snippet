# Known Issues & TODOs

## Open Issues

### Keyboard Shortcut for Saving Snippets
- **Status**: Deferred
- **Description**: Cannot reliably save snippets via keyboard shortcut on macOS. The Services menu (right-click > Services > Save to Snippet) works correctly, but keyboard shortcuts for Quick Actions don't receive selected text as input.
- **Root Cause**: macOS architectural difference - Services are selection-aware by design, but keyboard-triggered Quick Actions don't automatically capture the current selection from the frontmost app.
- **Workaround**: Use right-click > Services menu, or Cmd+C first then trigger the shortcut.
- **Potential Solutions**:
  - Use a different automation tool (Raycast, Alfred) that can capture selection before triggering
  - Accept the Cmd+C workflow
