/**
 * Cluster View — renders sender clusters as expandable accordion cards.
 */
import { stringToColor, getInitials, timeAgo, icons, getDomain } from '../utils/helpers.js';
import { renderEmailList } from './emailList.js';

/**
 * Render the clusters list.
 * @param {Array} clusters
 * @returns {string}
 */
export function renderClusters(clusters) {
  if (!clusters || clusters.length === 0) {
    return `
      <div class="empty-state">
        ${icons.inbox}
        <h3 class="empty-state-title">No emails found</h3>
        <p class="empty-state-text">Your inbox is empty or no emails matched your search.</p>
      </div>
    `;
  }

  return `
    <div class="clusters-list">
      ${clusters
        .map(
          (cluster, i) => `
        <div class="cluster-card" data-cluster-index="${i}" style="animation-delay: ${i * 0.04}s">
          <div class="cluster-header" role="button" tabindex="0" aria-expanded="false" aria-label="Expand emails from ${cluster.sender?.name || cluster.sender?.email || 'Unknown'}">
            <div class="cluster-avatar" style="background: ${stringToColor(cluster.sender?.email || '')}">
              ${getInitials(cluster.sender?.name, cluster.sender?.email)}
            </div>
            <div class="cluster-info">
              <div class="cluster-title-row">
                <span class="cluster-sender-name">${cluster.sender?.name || cluster.sender?.email || 'Unknown'}</span>
                <span class="cluster-domain-badge">@${getDomain(cluster.sender?.email || '')}</span>
              </div>
              <div class="cluster-sender-email">${cluster.sender?.email || ''}</div>
            </div>
            <div class="cluster-meta">
              <span class="cluster-count-pill">
                ${icons.mail}
                <span>${cluster.emailCount || cluster.emails?.length || 0}</span>
              </span>
              <span class="cluster-date">${timeAgo(cluster.latestDate)}</span>
              <div class="cluster-chevron">${icons.chevronDown}</div>
            </div>
          </div>
          <div class="cluster-emails">
            ${renderEmailList(cluster.emails || [], { showCategory: true })}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Initialize cluster accordion interactions.
 */
export function initClusters() {
  document.querySelectorAll('.cluster-header').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.cluster-card');
      const isExpanded = card.classList.contains('expanded');

      // Close all others
      document.querySelectorAll('.cluster-card.expanded').forEach((c) => {
        if (c !== card) {
          c.classList.remove('expanded');
          c.querySelector('.cluster-header')?.setAttribute('aria-expanded', 'false');
        }
      });

      card.classList.toggle('expanded');
      header.setAttribute('aria-expanded', String(!isExpanded));
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
}
