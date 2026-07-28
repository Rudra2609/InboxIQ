/**
 * Login component — full-screen login with Google OAuth button.
 */
import { icons, logoSVG } from '../utils/helpers.js';
import { API_BASE } from '../utils/api.js';

export function renderLogin() {
  return `
    <div class="ambient-bg">
      <div class="ambient-blob ambient-blob--1"></div>
      <div class="ambient-blob ambient-blob--2"></div>
      <div class="ambient-blob ambient-blob--3"></div>
    </div>
    <div class="login-container">
      <div class="login-card">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <span class="cluster-domain-badge" style="background:rgba(99,102,241,0.18);color:#a5b4fc;border-color:rgba(99,102,241,0.4);">
            ✨ NEO-OBSIDIAN AURORA UI · 2.0
          </span>
        </div>
        <div class="login-logo">
          ${logoSVG()}
          <h1>InboxIQ</h1>
        </div>
        <p class="login-subtitle">
          Smart email organizer that clusters your inbox by sender
          and auto-categorizes into meaningful groups.
        </p>

        <!-- Visual Preview Mini Card -->
        <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:20px;text-align:left;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:30px;height:30px;border-radius:8px;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;">GH</div>
            <div style="flex:1;">
              <div style="font-size:0.82rem;font-weight:600;color:#f8fafc;">GitHub Notifications <span style="font-size:0.7rem;color:#818cf8;background:rgba(99,102,241,0.2);padding:1px 6px;border-radius:99px;margin-left:4px;">@github.com</span></div>
              <div style="font-size:0.72rem;color:#94a3b8;">notifications@github.com</div>
            </div>
            <span style="font-size:0.7rem;font-weight:600;color:#818cf8;background:rgba(99,102,241,0.15);padding:2px 8px;border-radius:99px;">14 emails</span>
          </div>
          <div style="font-size:0.75rem;color:#cbd5e1;padding-left:40px;border-left:2px solid rgba(99,102,241,0.3);margin-left:14px;">
            "Security alert: new sign-in from Chrome on Windows..."
          </div>
        </div>

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
      window.location.href = `${API_BASE}/auth/google`;
    });
  }
}
