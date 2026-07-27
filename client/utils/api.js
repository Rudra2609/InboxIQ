/**
 * API client — handles all HTTP requests to the backend.
 */

const API_BASE = '';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Check authentication status */
export function getAuthStatus() {
  return request('/auth/status');
}

/** Get logged-in user profile */
export function getUser() {
  return request('/auth/user');
}

/** Logout */
export function logout() {
  return request('/auth/logout');
}

/**
 * Fetch emails with optional filters.
 * @param {{ maxResults?: number, pageToken?: string, category?: string, q?: string }} params
 */
export function fetchEmails(params = {}) {
  const qs = new URLSearchParams();
  if (params.maxResults) qs.set('maxResults', params.maxResults);
  if (params.pageToken) qs.set('pageToken', params.pageToken);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  const query = qs.toString();
  return request(`/api/emails${query ? `?${query}` : ''}`);
}

/** Fetch emails clustered by sender */
export function fetchClusters() {
  return request('/api/emails/clusters');
}

/** Fetch emails grouped by category */
export function fetchCategories() {
  return request('/api/emails/categories');
}

/** Fetch single email detail */
export function fetchEmailById(id) {
  return request(`/api/emails/${id}`);
}

/** Fetch dashboard stats */
export function fetchStats() {
  return request('/api/stats');
}
