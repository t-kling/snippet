/**
 * Background Service Worker
 * Handles context menus, keyboard shortcuts, and API communication
 */

// ========== API Utilities (inlined) ==========

const API_URLS = {
  local: 'http://localhost:5001/api',
  production: 'https://snippet-api.vercel.app/api'
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

async function createSnippet(snippetData) {
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
 * Handle Quick Save - instant save with no popup
 */
async function handleQuickSave(info, tab) {
  const selectedText = info.selectionText;
  const pageUrl = cleanUrl(info.pageUrl || tab.url);
  const pageTitle = tab.title;

  // Auto-generate title from first 50 chars
  const snippetTitle = selectedText.length > 50
    ? selectedText.substring(0, 50).trim() + '...'
    : selectedText.trim();

  try {
    // Character limit check (~1000 words = ~6000 chars)
    if (selectedText.length > 6000) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showToast',
        message: 'Text too long (max ~1000 words)',
        type: 'error'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Toast message failed:', chrome.runtime.lastError.message);
        }
      });
      return;
    }

    const snippetData = {
      title: snippetTitle,
      type: 'excerpt',
      content: selectedText,
      source: pageTitle,
      url: pageUrl,
      priority: 'medium',
      inQueue: true,
      topics: []
    };

    await createSnippet(snippetData);

    // Show success toast
    chrome.tabs.sendMessage(tab.id, {
      action: 'showToast',
      message: 'Snippet saved!',
      preview: snippetTitle,
      type: 'success'
    }, (response) => {
      // Check if message was received
      if (chrome.runtime.lastError) {
        console.warn('Toast message failed:', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.error('Quick save error:', error);
    chrome.tabs.sendMessage(tab.id, {
      action: 'showToast',
      message: error.message || 'Failed to save snippet',
      type: 'error'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Error toast failed:', chrome.runtime.lastError.message);
      }
    });
  }
}

/**
 * Handle Full Edit - open popup with pre-filled data
 */
async function handleFullEdit(info, tab) {
  const selectedText = info.selectionText;
  const pageUrl = cleanUrl(info.pageUrl || tab.url);
  const pageTitle = tab.title;

  // Store selection data for popup to access
  await chrome.storage.local.set({
    pendingSnippet: {
      content: selectedText,
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
      chrome.tabs.sendMessage(tab.id, {
        action: 'showToast',
        message: 'Image too large (max 300KB)',
        type: 'error'
      });
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
    chrome.tabs.sendMessage(tab.id, {
      action: 'showToast',
      message: 'Failed to save image',
      type: 'error'
    });
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
