/**
 * Login component — full-screen login with Google OAuth button.
 */
import { icons, logoSVG } from '../utils/helpers.js';

export function renderLogin() {
  return `
    <div class="ambient-bg">
      <div class="ambient-blob ambient-blob--1"></div>
      <div class="ambient-blob ambient-blob--2"></div>
      <div class="ambient-blob ambient-blob--3"></div>
    </div>
    <div class="login-container">
      <div class="login-card">
        <div class="login-logo">
          ${logoSVG()}
          <h1>InboxIQ</h1>
        </div>
        <p class="login-subtitle">
          Smart email organizer that clusters your inbox by sender
          and auto-categorizes into meaningful groups.
        </p>
        <div class="login-features">
          <div class="login-feature">
            ${icons.layers}
            <span>Cluster emails by sender — see all conversations grouped</span>
          </div>
          <div class="login-feature">
            ${icons.grid}
            <span>Auto-categorize into Primary, Social, Promotions & Updates</span>
          </div>
          <div class="login-feature">
            ${icons.shield}
            <span>Read-only access — your emails stay safe and private</span>
          </div>
        </div>
        <button class="btn-google" id="btn-google-login" type="button">
          ${icons.google}
          Sign in with Google
        </button>
        <p class="login-footer">
          InboxIQ only reads your emails. We never store, share, or modify them.
        </p>
      </div>
    </div>
  `;
}

export function initLogin() {
  const btn = document.getElementById('btn-google-login');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/auth/google';
    });
  }
}
