/**
 * API client for Snippet backend
 */

// API base URL - can be configured
const API_URLS = {
  local: 'http://localhost:5001/api',
  production: 'https://snippet-pr6g.vercel.app/api'
};

// Default to production
let API_BASE_URL = API_URLS.production;

/**
 * Set API URL based on environment
 */
async function initializeAPI() {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
  if (apiUrl) {
    API_BASE_URL = apiUrl;
  }
}

/**
 * Get JWT token from storage
 */
async function getAuthToken() {
  const { jwtToken } = await chrome.storage.local.get(['jwtToken']);
  return jwtToken;
}

/**
 * Save JWT token to storage
 */
async function saveAuthToken(token) {
  await chrome.storage.local.set({ jwtToken: token });
}

/**
 * Clear authentication
 */
async function clearAuth() {
  await chrome.storage.local.remove(['jwtToken']);
}

/**
 * Check if user is logged in
 */
async function isLoggedIn() {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Login to Snippet
 */
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

/**
 * Create a new snippet
 */
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

/**
 * Get user's topics for autocomplete
 */
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

export {
  initializeAPI,
  isLoggedIn,
  login,
  createSnippet,
  getTopics,
  clearAuth,
  API_BASE_URL
};
