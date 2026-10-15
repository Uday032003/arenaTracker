/**
 * Reusable HTTP client using native Fetch with cookies credentials
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const { method = 'GET', body, params, headers = {}, ...rest } = options;

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('arena_session_id') : null;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
    ...rest,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new ApiError('Network connection failed. Please verify your connection or server status.', 0);
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const errorDetails = data?.error?.details || null;
    throw new ApiError(errorMsg, response.status, errorDetails);
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

// Specialized API sub-modules
export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const itemsApi = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (payload) => api.post('/items', payload),
  update: (id, payload) => api.patch(`/items/${id}`, payload),
  archive: (id, isArchived) => api.patch(`/items/${id}/archive`, { isArchived }),
  delete: (id) => api.delete(`/items/${id}`),
  getStats: (id) => api.get(`/items/${id}/stats`),
};

export const variantsApi = {
  getByItemId: (itemId) => api.get(`/variants/item/${itemId}`),
  create: (itemId, payload) => api.post(`/variants/item/${itemId}`, payload),
  update: (id, payload) => api.patch(`/variants/${id}`, payload),
  delete: (id) => api.delete(`/variants/${id}`),
};

export const activitiesApi = {
  getAll: (params) => api.get('/activities', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (payload) => api.post('/activities', payload),
  update: (id, payload) => api.patch(`/activities/${id}`, payload),
  delete: (id) => api.delete(`/activities/${id}`),
};

export const sessionsApi = {
  getActive: () => api.get('/sessions/active'),
  start: (payload) => api.post('/sessions/start', payload),
  stop: (id, payload) => api.post(`/sessions/${id}/stop`, payload),
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
};

export const placesApi = {
  getBySessionId: (sessionId) => api.get(`/places/session/${sessionId}`),
  add: (sessionId, payload) => api.post(`/places/session/${sessionId}`, payload),
  update: (id, payload) => api.patch(`/places/${id}`, payload),
  delete: (id) => api.delete(`/places/${id}`),
};

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getRecentActivities: (limit) => api.get('/dashboard/recent-activities', { params: { limit } }),
};

export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  pin: (itemId) => api.post('/favorites', { itemId }),
  unpin: (itemId) => api.delete(`/favorites/${itemId}`),
};

export const insightsApi = {
  getInsights: (params) => api.get('/insights', { params }),
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  update: (payload) => api.patch('/settings', payload),
  exportUrl: `${API_BASE}/settings/export`,
  deleteAccount: (payload) => api.delete('/settings/account', { body: payload }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (payload) => api.post('/categories', payload),
  update: (id, payload) => api.patch(`/categories/${id}`, payload),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const remindersApi = {
  getAll: (params) => api.get('/reminders', { params }),
  getDue: () => api.get('/reminders/due'),
  create: (payload) => api.post('/reminders', payload),
  update: (id, payload) => api.patch(`/reminders/${id}`, payload),
  dismiss: (id) => api.post(`/reminders/${id}/dismiss`),
  snooze: (id, minutes = 10) => api.post(`/reminders/${id}/snooze`, { minutes }),
  complete: (id) => api.post(`/reminders/${id}/complete`),
  delete: (id) => api.delete(`/reminders/${id}`),
};

export const pushApi = {
  getPublicKey: () => api.get('/push/vapid-public-key'),
  getStatus: () => api.get('/push/status'),
  subscribe: (data) => api.post('/push/subscribe', data),
  unsubscribe: (data) => api.post('/push/unsubscribe', data),
  sendTest: () => api.post('/push/test'),
};
