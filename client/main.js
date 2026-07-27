/**
 * MailFlow — Main Application Entry Point
 *
 * Handles authentication state and renders the appropriate view.
 */
import { getAuthStatus } from './utils/api.js';
import { renderLogin, initLogin } from './components/login.js';
import { renderDashboard, initDashboard } from './components/dashboard.js';

const app = document.getElementById('app');

/**
 * Boot the application.
 */
async function boot() {
  try {
    const status = await getAuthStatus();

    if (status.authenticated) {
      app.innerHTML = renderDashboard(status.user);
      await initDashboard();
    } else {
      app.innerHTML = renderLogin();
      initLogin();
    }
  } catch (err) {
    // If auth check fails, show login
    console.warn('Auth check failed, showing login:', err.message);
    app.innerHTML = renderLogin();
    initLogin();
  }
}

// Listen for auth expiry events (from API client)
window.addEventListener('auth:expired', () => {
  app.innerHTML = renderLogin();
  initLogin();
});

// Start the app
boot();
