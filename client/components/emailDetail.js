/**
 * Email Detail Panel — slide-in panel showing full email content.
 */
import { stringToColor, getInitials, formatDate, escapeHtml, icons } from '../utils/helpers.js';
import { fetchEmailById } from '../utils/api.js';

/**
 * Open the email detail panel for a given email ID.
 * @param {string} emailId
 * @param {object} [emailPreview] - Preview data from the list (optional)
 */
export async function openEmailDetail(emailId, emailPreview = null) {
  // Remove any existing panel
  closeEmailDetail();

  // Create overlay + panel with preview data first
  const overlay = document.createElement('div');
  overlay.className = 'email-detail-overlay';
  overlay.id = 'email-detail-overlay';
  overlay.addEventListener('click', closeEmailDetail);

  const panel = document.createElement('div');
  panel.className = 'email-detail-panel';
  panel.id = 'email-detail-panel';
  panel.addEventListener('click', (e) => e.stopPropagation());

  // Show loading state
  const senderName = emailPreview?.from?.name || emailPreview?.from?.email || 'Loading...';
  const senderEmail = emailPreview?.from?.email || '';
  const senderColor = stringToColor(senderEmail);
  const initials = getInitials(emailPreview?.from?.name, senderEmail);

  panel.innerHTML = `
    <div class="email-detail-header">
      <span style="font-size:var(--font-size-sm);color:var(--color-foreground-muted);">Email Detail</span>
      <button class="email-detail-close" id="email-detail-close-btn" aria-label="Close email detail">
        ${icons.x}
      </button>
    </div>
    <div class="email-detail-subject">${escapeHtml(emailPreview?.subject || 'Loading...')}</div>
    <div class="email-detail-meta">
      <div class="email-detail-sender-avatar" style="background:${senderColor}">${initials}</div>
      <div class="email-detail-sender-info">
        <div class="email-detail-sender-name">${escapeHtml(senderName)}</div>
        <div class="email-detail-sender-email">${escapeHtml(senderEmail)}</div>
      </div>
      <div class="email-detail-date">${formatDate(emailPreview?.date)}</div>
    </div>
    <div class="email-detail-body">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span class="loading-text">Loading email content...</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Bind close button
  document.getElementById('email-detail-close-btn')?.addEventListener('click', closeEmailDetail);

  // Bind Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeEmailDetail();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Fetch full email content
  try {
    const email = await fetchEmailById(emailId);
    const bodyEl = panel.querySelector('.email-detail-body');
    if (bodyEl) {
      if (email.body) {
        // Create a sandboxed iframe for HTML email content
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width:100%;border:none;min-height:300px;background:white;border-radius:8px;';
        iframe.sandbox = 'allow-same-origin';
        bodyEl.innerHTML = '';
        bodyEl.appendChild(iframe);

        iframe.addEventListener('load', () => {
          const doc = iframe.contentDocument;
          if (doc) {
            doc.open();
            doc.write(`
              <html>
                <head><style>body{font-family:Inter,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;padding:16px;margin:0;word-wrap:break-word;}a{color:#6366f1;}img{max-width:100%;height:auto;}</style></head>
                <body>${email.body}</body>
              </html>
            `);
            doc.close();
            // Auto-resize iframe
            setTimeout(() => {
              iframe.style.height = doc.body.scrollHeight + 'px';
            }, 100);
          }
        });

        // Trigger load
        iframe.src = 'about:blank';
      } else {
        bodyEl.innerHTML = `<p style="color:var(--color-foreground-muted)">${escapeHtml(email.snippet || 'No content available')}</p>`;
      }
    }

    // Update subject and meta if we got more info
    if (email.subject) {
      const subjectEl = panel.querySelector('.email-detail-subject');
      if (subjectEl) subjectEl.textContent = email.subject;
    }
  } catch (err) {
    const bodyEl = panel.querySelector('.email-detail-body');
    if (bodyEl) {
      bodyEl.innerHTML = `<div class="empty-state"><p class="empty-state-text">Failed to load email: ${escapeHtml(err.message)}</p></div>`;
    }
  }
}

/**
 * Close the email detail panel.
 */
export function closeEmailDetail() {
  document.getElementById('email-detail-overlay')?.remove();
  document.getElementById('email-detail-panel')?.remove();
}
