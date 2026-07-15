// Thin fetch wrapper around the BlockBlog backend (Express + JWT).
// Base URL is configurable via VITE_API_URL; defaults to the local backend.

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
// Origin without the trailing /api — used to resolve relative /uploads image paths.
const SERVER_ORIGIN = API_BASE.replace(/\/api$/, '');

const TOKEN_KEY = 'bb_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Turn a stored image value into a loadable URL (absolute URLs pass through;
// backend-relative /uploads/... paths get the server origin prepended).
export function resolveImage(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return `${SERVER_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
}

async function request(path, { method = 'GET', body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body != null) {
    if (isForm) {
      opts.body = body; // FormData — let the browser set the boundary
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!res.ok) {
    throw new ApiError((data && data.message) || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const api = {
  // ── Auth ──
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  getSecurityQuestion: (email) => request(`/auth/forgot-password?email=${encodeURIComponent(email)}`),
  resetPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: payload }),

  // ── Posts ──
  listPosts: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const q = qs.toString();
    return request(`/posts${q ? `?${q}` : ''}`, { auth: true });
  },
  getPost: (id) => request(`/posts/${id}`, { auth: true }),
  createPost: (payload) => request('/posts', { method: 'POST', body: payload, auth: true }),
  updatePost: (id, payload) => request(`/posts/${id}`, { method: 'PUT', body: payload, auth: true }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE', auth: true }),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/posts/upload-image', { method: 'POST', body: fd, auth: true, isForm: true });
  },
  addComment: (id, text) => request(`/posts/${id}/comments`, { method: 'POST', body: { text }, auth: true }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST', auth: true }),
  toggleDislike: (id) => request(`/posts/${id}/dislike`, { method: 'POST', auth: true }),
  toggleSave: (id) => request(`/posts/${id}/save`, { method: 'POST', auth: true }),

  // ── User ──
  me: () => request('/users/me', { auth: true }),
  updateMe: (payload) => request('/users/me', { method: 'PUT', body: payload, auth: true }),
  myPosts: () => request('/users/me/posts', { auth: true }),
  savedPosts: () => request('/users/me/saved', { auth: true }),
};
