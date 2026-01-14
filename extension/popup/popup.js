/**
 * Popup logic for Full Edit mode
 */

// ========== API Utilities (inlined) ==========

const API_URLS = {
  local: 'http://localhost:5001/api',
  production: 'https://snippet-api.vercel.app/api'
};

let API_BASE_URL = API_URLS.local;

async function getAuthToken() {
  const { jwtToken } = await chrome.storage.local.get(['jwtToken']);
  return jwtToken;
}

async function saveAuthToken(token) {
  await chrome.storage.local.set({ jwtToken: token });
}

async function clearAuth() {
  await chrome.storage.local.remove(['jwtToken']);
}

async function isLoggedIn() {
  const token = await getAuthToken();
  return !!token;
}

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  await saveAuthToken(data.token);
  return data;
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
      await clearAuth();
      throw new Error('Session expired. Please login again.');
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to create snippet');
  }

  return await response.json();
}

async function getTopics() {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return [];
  }
}

// ========== URL Cleaner Utilities (inlined) ==========

function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) {
    return url;
  }
  return url.substring(0, maxLength) + '...';
}

// ========== Popup Logic ==========

// DOM elements
const loginScreen = document.getElementById('login-screen');
const editScreen = document.getElementById('edit-screen');
const loadingScreen = document.getElementById('loading-screen');

const loginForm = document.getElementById('login-form');
const snippetForm = document.getElementById('snippet-form');

const contentTextarea = document.getElementById('content');
const titleInput = document.getElementById('title');
const topicsInput = document.getElementById('topics');
const charCount = document.getElementById('char-count');

const loginError = document.getElementById('login-error');
const saveError = document.getElementById('save-error');

const sourceTitle = document.getElementById('source-title');
const sourceUrl = document.getElementById('source-url');

// Initialize popup
async function init() {
  const loggedIn = await isLoggedIn();

  if (!loggedIn) {
    showScreen('login');
    return;
  }

  // Check if there's pending snippet data
  const { pendingSnippet } = await chrome.storage.local.get(['pendingSnippet']);

  if (pendingSnippet && Date.now() - pendingSnippet.timestamp < 60000) {
    // Valid pending snippet (less than 1 minute old)
    loadSnippetData(pendingSnippet);
    showScreen('edit');

    // Load user's topics for suggestions
    loadTopicSuggestions();
  } else {
    // No pending data, show edit screen with empty form
    showScreen('edit');
    loadTopicSuggestions();
  }
}

/**
 * Show specific screen
 */
function showScreen(screen) {
  loadingScreen.style.display = 'none';
  loginScreen.style.display = 'none';
  editScreen.style.display = 'none';

  if (screen === 'loading') {
    loadingScreen.style.display = 'block';
  } else if (screen === 'login') {
    loginScreen.style.display = 'block';
  } else if (screen === 'edit') {
    editScreen.style.display = 'block';
  }
}

/**
 * Load snippet data into form
 */
function loadSnippetData(data) {
  if (data.content) {
    contentTextarea.value = data.content;
    updateCharCount();

    // Auto-generate title from content
    const autoTitle = data.content.length > 50
      ? data.content.substring(0, 50).trim() + '...'
      : data.content.trim();
    titleInput.placeholder = autoTitle;
  }

  if (data.imageData) {
    // For images, show a note in content
    contentTextarea.value = '[Image snippet]';
    titleInput.value = data.title || '';
  }

  if (data.source) {
    sourceTitle.textContent = data.source;
  }

  if (data.url) {
    sourceUrl.textContent = truncateUrl(data.url, 50);
    sourceUrl.title = data.url; // Full URL on hover
  }

  // Store full data for later
  window.pendingSnippetData = data;
}

/**
 * Load user's topics for suggestions
 */
async function loadTopicSuggestions() {
  const topics = await getTopics();
  const suggestionsDiv = document.getElementById('topic-suggestions');

  if (topics && topics.length > 0) {
    // Show up to 6 most recent topics
    const recentTopics = topics.slice(0, 6);
    suggestionsDiv.innerHTML = recentTopics
      .map(topic => `<span class="suggestion-tag" data-topic="${topic.name}">${topic.name}</span>`)
      .join('');

    // Add click handlers
    suggestionsDiv.querySelectorAll('.suggestion-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const currentTopics = topicsInput.value.trim();
        const newTopic = tag.dataset.topic;

        if (currentTopics) {
          const topicsArray = currentTopics.split(',').map(t => t.trim());
          if (!topicsArray.includes(newTopic)) {
            topicsInput.value = currentTopics + ', ' + newTopic;
          }
        } else {
          topicsInput.value = newTopic;
        }
      });
    });
  }
}

/**
 * Update character count
 */
function updateCharCount() {
  const count = contentTextarea.value.length;
  charCount.textContent = count;

  const counterDiv = charCount.parentElement;
  counterDiv.classList.remove('warning', 'error');

  if (count > 6000) {
    counterDiv.classList.add('error');
  } else if (count > 5000) {
    counterDiv.classList.add('warning');
  }
}

/**
 * Handle login
 */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('login-btn');

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  loginError.style.display = 'none';

  try {
    await login(email, password);
    showScreen('edit');
    loadTopicSuggestions();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

/**
 * Handle snippet save
 */
snippetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const content = contentTextarea.value.trim();
  const title = titleInput.value.trim() || (content.length > 50 ? content.substring(0, 50) + '...' : content);
  const type = document.querySelector('input[name="type"]:checked').value;
  const priority = document.querySelector('input[name="priority"]:checked').value;
  const inQueue = document.getElementById('in-queue').checked;
  const toEdit = document.getElementById('to-edit').checked;
  const topicsStr = topicsInput.value.trim();

  // Validate content length
  if (content.length > 6000) {
    saveError.textContent = 'Content too long (max 6000 characters)';
    saveError.style.display = 'block';
    return;
  }

  if (!content) {
    saveError.textContent = 'Please enter some content';
    saveError.style.display = 'block';
    return;
  }

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  saveError.style.display = 'none';

  try {
    const snippetData = {
      title,
      type,
      content,
      priority,
      inQueue,
      toEdit,
      topics: topicsStr ? topicsStr.split(',').map(t => t.trim()).filter(t => t) : []
    };

    // Add source and URL from pending data
    if (window.pendingSnippetData) {
      if (window.pendingSnippetData.source) {
        snippetData.source = window.pendingSnippetData.source;
      }
      if (window.pendingSnippetData.url) {
        snippetData.url = window.pendingSnippetData.url;
      }
      if (window.pendingSnippetData.imageData) {
        snippetData.imageData = window.pendingSnippetData.imageData;
      }
    }

    await createSnippet(snippetData);

    // Clear pending data
    await chrome.storage.local.remove(['pendingSnippet']);

    // Show success and close
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      window.close();
    }, 500);
  } catch (error) {
    saveError.textContent = error.message;
    saveError.style.display = 'block';
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Snippet';
  }
});

/**
 * Character counter
 */
contentTextarea.addEventListener('input', updateCharCount);

/**
 * Cancel button
 */
document.getElementById('cancel-btn').addEventListener('click', () => {
  window.close();
});

/**
 * Logout button
 */
document.getElementById('logout-btn').addEventListener('click', async () => {
  await clearAuth();
  showScreen('login');
});

/**
 * Open web app link
 */
document.getElementById('open-web-app').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'http://localhost:5173' }); // Update with production URL
});

// Add cloze deletion support (Ctrl/Cmd+Shift+C)
contentTextarea.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    createCloze();
  }
});

/**
 * Create cloze deletion for selected text in content
 */
function createCloze() {
  const textarea = contentTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (!selectedText) {
    return;
  }

  // Find max cloze number
  const existingClozes = textarea.value.match(/\{\{c(\d+)::/g) || [];
  const maxClozeNum = existingClozes.reduce((max, match) => {
    const num = parseInt(match.match(/\d+/)[0]);
    return num > max ? num : max;
  }, 0);

  const newClozeNum = maxClozeNum + 1;
  const clozeText = `{{c${newClozeNum}::${selectedText}}}`;

  // Replace selection with cloze
  textarea.value = textarea.value.substring(0, start) + clozeText + textarea.value.substring(end);

  // Update char count
  updateCharCount();

  // Set cursor after cloze
  const newCursorPos = start + clozeText.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
}

// Initialize on load
init();
