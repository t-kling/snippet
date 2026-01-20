/**
 * Background Service Worker
 * Handles context menus, keyboard shortcuts, and API communication
 */

// ========== API Utilities (inlined) ==========

const API_URLS = {
  local: 'http://localhost:5001/api',
  production: 'https://snippet-pr6g.vercel.app/api'
};

let API_BASE_URL = API_URLS.local;

async function initializeAPI() {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
  if (apiUrl) {
    API_BASE_URL = apiUrl;
  }
}

async function getAuthToken() {
  const { jwtToken } = await chrome.storage.local.get(['jwtToken']);
  return jwtToken;
}

async function isLoggedIn() {
  const token = await getAuthToken();
  return !!token;
}

// Queue management for offline support
async function getOfflineQueue() {
  const { offlineQueue } = await chrome.storage.local.get(['offlineQueue']);
  return offlineQueue || [];
}

async function addToOfflineQueue(snippetData) {
  const queue = await getOfflineQueue();
  queue.push({
    data: snippetData,
    timestamp: Date.now()
  });
  await chrome.storage.local.set({ offlineQueue: queue });
  console.log('[Snippet Extension] Added to offline queue. Queue size:', queue.length);
}

async function syncOfflineQueue() {
  const queue = await getOfflineQueue();

  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Snippet Extension] Syncing ${queue.length} queued snippet(s)...`);

  const failed = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await createSnippetDirect(item.data);
      synced++;
    } catch (error) {
      console.error('[Snippet Extension] Failed to sync queued item:', error);
      failed.push(item);
    }
  }

  // Update queue with only failed items
  await chrome.storage.local.set({ offlineQueue: failed });

  console.log(`[Snippet Extension] Synced ${synced}/${queue.length} queued snippet(s)`);

  return { synced, failed: failed.length };
}

async function createSnippetDirect(snippetData) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/snippets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(snippetData)
  });

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.remove(['jwtToken']);
      throw new Error('Session expired. Please login again.');
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to create snippet');
  }

  return await response.json();
}

async function createSnippet(snippetData) {
  // First, try to sync any queued snippets
  try {
    const result = await syncOfflineQueue();
    if (result.synced > 0) {
      console.log(`[Snippet Extension] Synced ${result.synced} queued snippet(s)`);
    }
  } catch (err) {
    console.warn('[Snippet Extension] Failed to sync queue:', err);
  }

  // Now try to create the new snippet
  try {
    return await createSnippetDirect(snippetData);
  } catch (error) {
    // Check if it's a network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('[Snippet Extension] No internet connection, queuing snippet');
      await addToOfflineQueue(snippetData);
      throw new Error('Saved offline (will sync when online)');
    }
    throw error;
  }
}

// ========== URL Cleaner Utilities (inlined) ==========

function cleanUrl(url) {
  try {
    const urlObj = new URL(url);
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'referrer', 'source', '_ga', 'mc_cid', 'mc_eid'
    ];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

// ========== Text Formatting Utilities ==========

/**
 * Add sensible paragraph breaks to long text blocks
 */
function addParagraphBreaks(text) {
  // If text already has paragraph breaks (double newlines), return as-is
  if (text.includes('\n\n')) {
    return text;
  }

  // If text has single newlines, return as-is (respect original formatting)
  if (text.includes('\n')) {
    return text;
  }

  // Only process long text blocks without any line breaks
  if (text.length < 200) {
    return text;
  }

  // Split into sentences (basic heuristic: period/question/exclamation followed by space and capital)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length <= 2) {
    return text; // Too short to break up
  }

  // Group into paragraphs of 2-4 sentences
  const paragraphs = [];
  let currentParagraph = [];

  sentences.forEach((sentence, i) => {
    currentParagraph.push(sentence.trim());

    // Create paragraph break after 2-4 sentences, or at the end
    if (currentParagraph.length >= 3 || i === sentences.length - 1) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
  });

  return paragraphs.join('\n\n');
}

// ========== Service Worker Logic ==========

// Initialize API on extension load
initializeAPI();

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for selected text
  chrome.contextMenus.create({
    id: 'quick-save',
    title: 'Quick Save to Snippet',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'full-edit',
    title: 'Save & Edit Snippet',
    contexts: ['selection']
  });

  // Context menu for images
  chrome.contextMenus.create({
    id: 'save-image',
    title: 'Save Image to Snippet',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const loggedIn = await isLoggedIn();

  if (!loggedIn) {
    // Open popup to login
    chrome.action.openPopup();
    return;
  }

  if (info.menuItemId === 'quick-save') {
    await handleQuickSave(info, tab);
  } else if (info.menuItemId === 'full-edit') {
    await handleFullEdit(info, tab);
  } else if (info.menuItemId === 'save-image') {
    await handleImageSave(info, tab);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const loggedIn = await isLoggedIn();

  if (!loggedIn) {
    chrome.action.openPopup();
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'quick-save') {
    // Request selected text from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, async (response) => {
      if (response && response.selectedText) {
        const info = {
          selectionText: response.selectedText,
          pageUrl: tab.url
        };
        await handleQuickSave(info, tab);
      }
    });
  } else if (command === 'full-edit') {
    chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, async (response) => {
      if (response && response.selectedText) {
        const info = {
          selectionText: response.selectedText,
          pageUrl: tab.url
        };
        await handleFullEdit(info, tab);
      }
    });
  }
});

/**
 * Show toast with retry logic
 */
async function showToast(tabId, message, preview = '', type = 'success', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'showToast',
        message,
        preview,
        type
      });
      console.log('[Snippet Extension] Toast sent successfully');
      return true;
    } catch (error) {
      console.warn(`[Snippet Extension] Toast attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  console.error('[Snippet Extension] Toast failed after all retries');
  return false;
}

/**
 * Handle Quick Save - instant save with no popup
 */
async function handleQuickSave(info, tab) {
  const selectedText = info.selectionText;
  const pageUrl = cleanUrl(info.pageUrl || tab.url);
  const pageTitle = tab.title;

  // Add paragraph breaks to improve readability
  const formattedText = addParagraphBreaks(selectedText);

  // Auto-generate title from first 50 chars
  const snippetTitle = formattedText.length > 50
    ? formattedText.substring(0, 50).trim() + '...'
    : formattedText.trim();

  try {
    // Character limit check (~1000 words = ~6000 chars)
    if (formattedText.length > 6000) {
      await showToast(tab.id, 'Text too long (max ~1000 words)', '', 'error');
      return;
    }

    const snippetData = {
      title: snippetTitle,
      type: 'excerpt',
      content: formattedText,
      source: pageTitle,
      url: pageUrl,
      priority: 'medium',
      inQueue: true,
      topics: []
    };

    await createSnippet(snippetData);

    console.log('[Snippet Extension] Snippet created, showing toast');

    // Show success toast
    await showToast(tab.id, 'Snippet saved!', snippetTitle, 'success');
  } catch (error) {
    console.error('Quick save error:', error);

    // Check if it's an offline save (success case) or a real error
    if (error.message && error.message.includes('Saved offline')) {
      await showToast(tab.id, error.message, snippetTitle, 'success');
    } else {
      await showToast(tab.id, error.message || 'Failed to save snippet', '', 'error');
    }
  }
}

/**
 * Handle Full Edit - open popup with pre-filled data
 */
async function handleFullEdit(info, tab) {
  const selectedText = info.selectionText;
  const pageUrl = cleanUrl(info.pageUrl || tab.url);
  const pageTitle = tab.title;

  // Add paragraph breaks to improve readability
  const formattedText = addParagraphBreaks(selectedText);

  // Store selection data for popup to access
  await chrome.storage.local.set({
    pendingSnippet: {
      content: formattedText,
      source: pageTitle,
      url: pageUrl,
      timestamp: Date.now()
    }
  });

  // Open popup
  chrome.action.openPopup();
}

/**
 * Handle Image Save
 */
async function handleImageSave(info, tab) {
  const imageUrl = info.srcUrl;
  const pageUrl = cleanUrl(info.pageUrl || tab.url);
  const pageTitle = tab.title;

  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Check size (300KB limit)
    if (blob.size > 300 * 1024) {
      await showToast(tab.id, 'Image too large (max 300KB)', '', 'error');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async function() {
      const base64data = reader.result;

      // Auto-generate title
      const domain = new URL(pageUrl).hostname;
      const snippetTitle = `Image from ${domain}`;

      // Store for popup
      await chrome.storage.local.set({
        pendingSnippet: {
          imageData: base64data,
          source: pageTitle,
          url: pageUrl,
          title: snippetTitle,
          timestamp: Date.now()
        }
      });

      // Open popup for confirmation
      chrome.action.openPopup();
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Image save error:', error);
    await showToast(tab.id, 'Failed to save image', '', 'error');
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSnippet') {
    createSnippet(request.data)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});
