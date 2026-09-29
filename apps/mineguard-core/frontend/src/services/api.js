/**
 * TerraMesh AI — Central API client
 * ====================================
 * The ONLY module that knows the backend URL and the auth key.
 *
 * - URL: `VITE_API_BASE` build-time env; empty default keeps the localhost
 *   dev behaviour AND enables the same-origin proxied deployment (the
 *   frontend nginx proxies /api and /ws to the backend service).
 * - Key: the signed session token issued by /api/login (preferred), or an
 *   operator-configured key from localStorage. NEVER hardcode the backend
 *   secret in component code — previously 14 copies shipped to browsers.
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000').replace(/\/+$/, '');

export const API_BASE = RAW_BASE;

export function getApiKey() {
  try {
    return (
      localStorage.getItem('mineguard_auth_token') ||
      localStorage.getItem('terramesh_api_key') ||
      ''
    );
  } catch {
    return '';
  }
}

export function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const key = getApiKey();
  if (key && !('X-API-Key' in headers)) {
    headers['X-API-Key'] = key;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export function wsUrl() {
  if (RAW_BASE) {
    return RAW_BASE.replace(/^http/, 'ws') + '/ws/live-monitoring';
  }
  // Same-origin deployment (frontend nginx proxies /ws)
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/live-monitoring`;
}
