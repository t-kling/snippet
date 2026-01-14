/**
 * Content Script
 * Runs on all web pages to handle text selection and show toast notifications
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showToast') {
    showToast(request.message, request.preview, request.type);
    sendResponse({ success: true });
  } else if (request.action === 'getSelection') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ selectedText });
  }
  return true; // Keep channel open for async responses
});

/**
 * Show toast notification
 */
function showToast(message, preview = '', type = 'success') {
  // Remove existing toast if any
  const existingToast = document.getElementById('snippet-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'snippet-toast';
  toast.className = `snippet-toast snippet-toast-${type}`;

  // Add content
  const icon = type === 'success' ? '✓' : '✗';
  toast.innerHTML = `
    <div class="snippet-toast-icon">${icon}</div>
    <div class="snippet-toast-content">
      <div class="snippet-toast-message">${escapeHtml(message)}</div>
      ${preview ? `<div class="snippet-toast-preview">"${escapeHtml(truncate(preview, 50))}"</div>` : ''}
    </div>
  `;

  // Add to page
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('snippet-toast-show');
  }, 10);

  // Remove after 2 seconds
  setTimeout(() => {
    toast.classList.remove('snippet-toast-show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Truncate text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
