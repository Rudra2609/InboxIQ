/**
 * Email list renderer — renders individual email items within clusters or categories.
 */
import { timeAgo, escapeHtml } from '../utils/helpers.js';

/**
 * Render a list of email items.
 * @param {Array} emails
 * @param {object} [options]
 * @param {boolean} [options.showCategory] - Whether to show category badge
 * @param {boolean} [options.showSender] - Whether to show sender name
 * @returns {string}
 */
export function renderEmailList(emails, options = {}) {
  if (!emails || emails.length === 0) {
    return '<div class="empty-state"><p class="empty-state-text">No emails found</p></div>';
  }

  return emails
    .map(
      (email) => `
    <div class="email-item ${email.isRead === false ? 'unread' : ''}" data-email-id="${escapeHtml(email.id)}">
      <div class="email-unread-dot" aria-hidden="true"></div>
      <div class="email-content">
        ${options.showSender ? `<div class="email-sender-inline" style="font-size:0.75rem;color:var(--color-foreground-muted);margin-bottom:2px;">${escapeHtml(email.from?.name || email.from?.email || 'Unknown')}</div>` : ''}
        <div class="email-subject">${escapeHtml(email.subject || '(No subject)')}</div>
        <div class="email-snippet">${escapeHtml(email.snippet || '')}</div>
        ${options.showCategory && email.category ? `<span class="email-category-badge ${email.category}">${email.category}</span>` : ''}
      </div>
      <div class="email-time">${timeAgo(email.date)}</div>
    </div>
  `
    )
    .join('');
}
