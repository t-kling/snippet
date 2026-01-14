/**
 * Content Script
 * Runs on all web pages to handle text selection and show toast notifications
 */

console.log('[Snippet Extension] Content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Snippet Extension] Message received:', request.action);

  if (request.action === 'showToast') {
    console.log('[Snippet Extension] Showing toast:', request.message);
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
  console.log('[Snippet Extension] showToast called');

  // Remove existing toast if any
  const existingToast = document.getElementById('snippet-toast');
  if (existingToast) {
    console.log('[Snippet Extension] Removing existing toast');
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

  console.log('[Snippet Extension] Toast element created');

  // Add to page
  if (!document.body) {
    console.error('[Snippet Extension] document.body is null!');
    return;
  }

  document.body.appendChild(toast);
  console.log('[Snippet Extension] Toast appended to body');

  // Check if element is actually in the DOM
  const checkToast = document.getElementById('snippet-toast');
  console.log('[Snippet Extension] Toast in DOM:', !!checkToast);
  if (checkToast) {
    console.log('[Snippet Extension] Toast position:', window.getComputedStyle(checkToast).position);
    console.log('[Snippet Extension] Toast z-index:', window.getComputedStyle(checkToast).zIndex);
    console.log('[Snippet Extension] Toast opacity:', window.getComputedStyle(checkToast).opacity);
  }

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('snippet-toast-show');
    console.log('[Snippet Extension] Animation class added');
  }, 10);

  // Remove after 2 seconds
  setTimeout(() => {
    toast.classList.remove('snippet-toast-show');
    setTimeout(() => {
      toast.remove();
      console.log('[Snippet Extension] Toast removed');
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
