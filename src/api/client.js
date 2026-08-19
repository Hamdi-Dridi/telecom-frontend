/* =======================================================================
   API client for the Django backend. Base URL is configurable via the
   VITE_API_URL env var (see .env.example) — defaults to localhost:8000,
   the standard `python manage.py runserver` address.
   ========================================================================= */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const TOKEN_KEY = 'kpi_api_token_v1';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Pulls the first useful message out of a DRF error payload, whatever
 *  shape it comes in ({detail}, {field: [...]}, [...], plain string). */
function extractMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    const msg = Array.isArray(val) ? val[0] : val;
    return typeof msg === 'string' ? msg : fallback;
  }
  return fallback;
}

async function request(path, { method = 'GET', body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      `Impossible de joindre le serveur (${BASE_URL}). Vérifiez qu'il est démarré (python manage.py runserver) et accessible.`,
      0, null
    );
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    throw new ApiError(extractMessage(data, `Erreur ${res.status}`), res.status, data);
  }
  return raw ? { data, res } : data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
  /** For file downloads (CSV/JSON export) — returns the raw Response so
   *  callers can read blob()/text() and trigger a browser download. */
  getRaw: async (path) => {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(extractMessage(data, `Erreur ${res.status}`), res.status, data);
    }
    return res;
  },
};

export { BASE_URL };

/** DRF's DEFAULT_PAGINATION_CLASS wraps list responses as
 *  {count, next, previous, results}. This unwraps either shape uniformly
 *  so callers never need to think about pagination for these small lists
 *  (PAGE_SIZE is 200 — comfortably above every list this app shows). */
export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
