/**
 * Dashboard component — main layout with sidebar, stats, and content area.
 */
import { icons, logoSVG, escapeHtml } from '../utils/helpers.js';
import { fetchStats, fetchClusters, fetchCategories, fetchDashboardData, logout, API_BASE } from '../utils/api.js';
import { renderClusters, initClusters } from './clusterView.js';
import { renderCategoryTabs, initCategoryTabs } from './categoryTabs.js';
import { renderEmailList } from './emailList.js';
import { openEmailDetail } from './emailDetail.js';

let currentView = 'clusters';
let currentCategory = 'all';
let cachedClusters = null;
let cachedCategories = null;
let cachedStats = null;
let userInfo = null;

/**
 * Render the full dashboard layout.
 * @param {object} user - { email, name }
 * @returns {string}
 */
export function renderDashboard(user) {
  userInfo = user;
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || '??';

  return `
    <div class="ambient-bg">
      <div class="ambient-blob ambient-blob--1"></div>
      <div class="ambient-blob ambient-blob--2"></div>
      <div class="ambient-blob ambient-blob--3"></div>
    </div>
    <div class="app-layout">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle sidebar">
            ${icons.menu}
          </button>
          <div class="header-logo">
            ${logoSVG()}
            <span>InboxIQ</span>
          </div>
          <div class="header-search">
            ${icons.search}
            <input type="text" id="search-input" placeholder="Search emails..." aria-label="Search emails" />
          </div>
        </div>
        <div class="header-right">
          <button class="btn-refresh" id="btn-refresh" aria-label="Refresh emails" title="Refresh">
            ${icons.refresh}
          </button>
          <div style="position:relative">
            <button class="user-menu" id="user-menu-btn" aria-label="User menu">
              <div class="user-avatar">${initials}</div>
              <span class="user-name">${escapeHtml(user?.name || user?.email || 'User')}</span>
              ${icons.chevronDown}
            </button>
            <div class="user-dropdown" id="user-dropdown" style="display:none">
              <button class="switch-account-btn" id="btn-switch-account">
                ${icons.users}
                Switch Account
              </button>
              <button class="logout-btn" id="btn-logout">
                ${icons.logOut}
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div>
          <div class="sidebar-section-title">Views</div>
          <nav class="sidebar-nav">
            <button class="sidebar-item ${currentView === 'clusters' ? 'active' : ''}" data-view="clusters">
              ${icons.layers}
              Sender Clusters
            </button>
            <button class="sidebar-item ${currentView === 'categories' ? 'active' : ''}" data-view="categories">
              ${icons.grid}
              Categories
            </button>
          </nav>
        </div>
        <div>
          <div class="sidebar-section-title">Categories</div>
          <nav class="sidebar-nav" id="sidebar-categories">
            <button class="sidebar-item" data-sidebar-category="primary">
              <span class="sidebar-category-dot primary"></span>
              Primary
              <span class="sidebar-badge" id="sidebar-count-primary">-</span>
            </button>
            <button class="sidebar-item" data-sidebar-category="social">
              <span class="sidebar-category-dot social"></span>
              Social
              <span class="sidebar-badge" id="sidebar-count-social">-</span>
            </button>
            <button class="sidebar-item" data-sidebar-category="promotions">
              <span class="sidebar-category-dot promotions"></span>
              Promotions
              <span class="sidebar-badge" id="sidebar-count-promotions">-</span>
            </button>
            <button class="sidebar-item" data-sidebar-category="updates">
              <span class="sidebar-category-dot updates"></span>
              Updates
              <span class="sidebar-badge" id="sidebar-count-updates">-</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="content" id="main-content">
        <!-- Stats -->
        <div class="stats-grid" id="stats-grid">
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
        </div>

        <!-- Dynamic Content Area -->
        <div id="content-area">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading your emails...</span>
          </div>
        </div>
      </main>
    </div>
  `;
}

/**
 * Initialize all dashboard interactions and load data.
 */
export async function initDashboard() {
  // Sidebar view switching
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderContent();
    });
  });

  // Sidebar category shortcuts
  document.querySelectorAll('[data-sidebar-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = 'categories';
      currentCategory = btn.dataset.sidebarCategory;
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
      document.querySelector('[data-view="categories"]')?.classList.add('active');
      renderContent();
    });
  });

  // User menu
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
    window.location.reload();
  });

  // Switch Account
  document.getElementById('btn-switch-account')?.addEventListener('click', () => {
    window.location.href = `${API_BASE}/auth/google/switch`;
  });

  // Refresh
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    cachedClusters = null;
    cachedCategories = null;
    cachedStats = null;
    const btn = document.getElementById('btn-refresh');
    btn?.classList.add('spinning');
    loadAllData().finally(() => btn?.classList.remove('spinning'));
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (sidebar.classList.contains('open')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
          sidebar.classList.remove('open');
          overlay.remove();
        });
        sidebar.parentElement.appendChild(overlay);
      } else {
        document.getElementById('sidebar-overlay')?.remove();
      }
    });
  }

  // Search
  let searchTimeout;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      // For now, filter clusters/categories client-side
      renderContent(e.target.value);
    }, 300);
  });

  // Load data
  await loadAllData();
}

async function loadAllData() {
  try {
    const data = await fetchDashboardData();

    cachedStats = data.stats || {
      total: 0,
      unread: 0,
      byCategory: { primary: 0, social: 0, promotions: 0, updates: 0 }
    };
    cachedClusters = data.clusters || [];
    cachedCategories = data.categories || { primary: [], social: [], promotions: [], updates: [] };

    renderStats();
    updateSidebarCounts();
    renderContent();
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('content-area').innerHTML = `
      <div class="empty-state">
        ${icons.mailPlus}
        <h3 class="empty-state-title">Unable to load emails</h3>
        <p class="empty-state-text">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderStats() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  const stats = [
    {
      icon: icons.mail,
      label: 'Total Emails',
      value: cachedStats?.total ?? 0,
      color: 'var(--color-accent)',
      colorSoft: 'var(--color-accent-soft)',
    },
    {
      icon: icons.mailOpen,
      label: 'Unread',
      value: cachedStats?.unread ?? 0,
      color: 'var(--color-success)',
      colorSoft: 'rgba(34,197,94,0.12)',
    },
    {
      icon: icons.users,
      label: 'Senders',
      value: Array.isArray(cachedClusters)
        ? cachedClusters.length
        : (cachedClusters?.clusters?.length ?? 0),
      color: 'var(--cat-social)',
      colorSoft: 'rgba(236,72,153,0.12)',
    },
    {
      icon: icons.barChart,
      label: 'Categories',
      value: 4,
      color: 'var(--cat-updates)',
      colorSoft: 'rgba(6,182,212,0.12)',
    },
  ];

  grid.innerHTML = stats
    .map(
      (stat, i) => `
    <div class="stat-card" style="--stat-color:${stat.color};--stat-color-soft:${stat.colorSoft};animation: clusterSlideIn 0.4s var(--ease-expo) ${i * 0.08}s both;">
      <div class="stat-card-icon">${stat.icon}</div>
      <div class="stat-card-value">${stat.value}</div>
      <div class="stat-card-label">${stat.label}</div>
    </div>
  `
    )
    .join('');
}

function updateSidebarCounts() {
  const cats = cachedStats?.byCategory || {};
  const el = (id) => document.getElementById(id);
  if (el('sidebar-count-primary')) el('sidebar-count-primary').textContent = cats.primary ?? 0;
  if (el('sidebar-count-social')) el('sidebar-count-social').textContent = cats.social ?? 0;
  if (el('sidebar-count-promotions')) el('sidebar-count-promotions').textContent = cats.promotions ?? 0;
  if (el('sidebar-count-updates')) el('sidebar-count-updates').textContent = cats.updates ?? 0;
}

function renderContent(searchQuery = '') {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  if (currentView === 'clusters') {
    let clusters = cachedClusters?.clusters || cachedClusters || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      clusters = clusters.filter(
        (c) =>
          c.sender?.name?.toLowerCase().includes(q) ||
          c.sender?.email?.toLowerCase().includes(q) ||
          c.emails?.some(
            (e) =>
              e.subject?.toLowerCase().includes(q) || e.snippet?.toLowerCase().includes(q)
          )
      );
    }
    contentArea.innerHTML = renderClusters(clusters);
    initClusters();
  } else {
    // Categories view
    const categoriesData = cachedCategories || {};
    const counts = {
      primary: categoriesData.primary?.length || 0,
      social: categoriesData.social?.length || 0,
      promotions: categoriesData.promotions?.length || 0,
      updates: categoriesData.updates?.length || 0,
    };

    let emails;
    if (currentCategory === 'all') {
      emails = [
        ...(categoriesData.primary || []),
        ...(categoriesData.social || []),
        ...(categoriesData.promotions || []),
        ...(categoriesData.updates || []),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      emails = categoriesData[currentCategory] || [];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      emails = emails.filter(
        (e) =>
          e.subject?.toLowerCase().includes(q) ||
          e.snippet?.toLowerCase().includes(q) ||
          e.from?.name?.toLowerCase().includes(q) ||
          e.from?.email?.toLowerCase().includes(q)
      );
    }

    contentArea.innerHTML = `
      ${renderCategoryTabs(currentCategory, counts)}
      <div id="category-emails">
        ${renderEmailList(emails, { showCategory: currentCategory === 'all', showSender: true })}
      </div>
    `;

    initCategoryTabs((category) => {
      currentCategory = category;
      renderContent(document.getElementById('search-input')?.value || '');
    });
  }

  // Bind email click handlers
  bindEmailClicks();
}

function bindEmailClicks() {
  document.querySelectorAll('.email-item[data-email-id]').forEach((item) => {
    item.addEventListener('click', () => {
      const emailId = item.dataset.emailId;
      // Find preview data from cache
      let preview = null;
      if (cachedClusters) {
        const clusters = cachedClusters.clusters || cachedClusters;
        for (const cluster of clusters) {
          const found = cluster.emails?.find((e) => e.id === emailId);
          if (found) { preview = found; break; }
        }
      }
      if (!preview && cachedCategories) {
        for (const cat of Object.values(cachedCategories)) {
          if (Array.isArray(cat)) {
            const found = cat.find((e) => e.id === emailId);
            if (found) { preview = found; break; }
          }
        }
      }
      openEmailDetail(emailId, preview);
    });
  });
}
