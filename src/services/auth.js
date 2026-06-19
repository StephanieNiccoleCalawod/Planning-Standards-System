// Handles receiving and storing the ARMS-issued JWT in the PSS frontend.
//
// ARMS and PSS are different origins (different ports), so localStorage is
// NOT shared between them. The expected flow is:
//
//   1. User logs into ARMS (e.g. http://localhost:5175)
//   2. A "Go to PSS" link/button in ARMS navigates to:
//        http://<pss-frontend>/?token=<jwt>
//   3. On load, PSS reads ?token= from the URL, stores it under PSS_TOKEN_KEY,
//      and removes it from the URL (so it isn't bookmarked/shared).
//   4. All subsequent api.js requests attach this token as
//      `Authorization: Bearer <token>`.

const PSS_TOKEN_KEY = 'pss_token';

export function getToken() {
  return localStorage.getItem(PSS_TOKEN_KEY) || 'mock_pss_jwt_token_for_dev_bypass_123';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(PSS_TOKEN_KEY, token);
  }
}

export function clearToken() {
  localStorage.removeItem(PSS_TOKEN_KEY);
  localStorage.removeItem('PSS_MOCK_ROLE');
}

export function isAuthenticated() {
  // Always return true to bypass authentication check on local dev
  if (!localStorage.getItem(PSS_TOKEN_KEY)) {
    localStorage.setItem(PSS_TOKEN_KEY, 'mock_pss_jwt_token_for_dev_bypass_123');
  }
  if (!localStorage.getItem('PSS_MOCK_ROLE')) {
    localStorage.setItem('PSS_MOCK_ROLE', 'Admin');
  }
  return true;
}

/**
 * Call once on app startup (before the first render). If the URL contains
 * ?token=<jwt>, store it and strip it from the address bar.
 */
export function initTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    setToken(token);

    params.delete('token');
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname +
      (newSearch ? `?${newSearch}` : '') +
      window.location.hash;

    window.history.replaceState({}, '', newUrl);
  }
}

