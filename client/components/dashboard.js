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
            <kbd class="search-shortcut" title="Press ⌘K to open spotlight search">⌘K</kbd>
          </div>
        </div>
        <div class="header-right">
          <button class="mobile-search-toggle" id="mobile-search-toggle" aria-label="Search emails" title="Search">
            ${icons.search}
          </button>
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

      <!-- Mobile Search Bar (<768px expandable) -->
      <div class="mobile-search-bar" id="mobile-search-bar" style="display:none">
        <div class="mobile-search-input-wrapper">
          ${icons.search}
          <input type="text" id="mobile-search-input" placeholder="Search emails, senders, subjects..." aria-label="Search emails on mobile" />
          <button class="mobile-search-clear" id="mobile-search-clear" aria-label="Clear search" style="display:none">
            ${icons.x}
          </button>
        </div>
      </div>

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

      <!-- Mobile Bottom Navigation (<768px only) -->
      <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile navigation">
        <button class="mobile-nav-item ${currentView === 'clusters' ? 'active' : ''}" data-mobile-view="clusters">
          <span class="mobile-nav-icon">${icons.layers}</span>
          <span class="mobile-nav-label">Clusters</span>
        </button>
        <button class="mobile-nav-item ${currentView === 'categories' ? 'active' : ''}" data-mobile-view="categories">
          <span class="mobile-nav-icon">${icons.grid}</span>
          <span class="mobile-nav-label">Inbox</span>
        </button>
        <button class="mobile-nav-item" data-mobile-action="search" aria-label="Search emails">
          <span class="mobile-nav-icon">${icons.search}</span>
          <span class="mobile-nav-label">Search</span>
        </button>
        <button class="mobile-nav-item" data-mobile-action="stats" aria-label="Toggle Stats">
          <span class="mobile-nav-icon">${icons.barChart}</span>
          <span class="mobile-nav-label">Stats</span>
        </button>
      </nav>

      <!-- Spotlight Command Palette Modal (Cmd+K / Ctrl+K) -->
      <div class="cmd-palette-overlay" id="cmd-palette-overlay" style="display:none" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="cmd-palette-modal">
          <div class="cmd-palette-search">
            ${icons.search}
            <input type="text" id="cmd-palette-input" placeholder="Type a command, search senders or jump to category..." autocomplete="off" />
            <kbd class="cmd-shortcut-badge">ESC</kbd>
          </div>
          <div class="cmd-palette-list" id="cmd-palette-list">
            <div class="cmd-group-title">QUICK VIEWS</div>
            <button class="cmd-item" data-cmd-view="clusters">
              ${icons.layers}
              <span>Sender Clusters</span>
              <kbd>C</kbd>
            </button>
            <button class="cmd-item" data-cmd-view="categories">
              ${icons.grid}
              <span>All Categories</span>
              <kbd>I</kbd>
            </button>
            <div class="cmd-group-title">CATEGORIES</div>
            <button class="cmd-item" data-cmd-cat="primary">
              <span class="sidebar-category-dot primary"></span>
              <span>Primary Inbox</span>
            </button>
            <button class="cmd-item" data-cmd-cat="social">
              <span class="sidebar-category-dot social"></span>
              <span>Social Notifications</span>
            </button>
            <button class="cmd-item" data-cmd-cat="promotions">
              <span class="sidebar-category-dot promotions"></span>
              <span>Promotions & Deals</span>
            </button>
            <button class="cmd-item" data-cmd-cat="updates">
              <span class="sidebar-category-dot updates"></span>
              <span>Updates & Alerts</span>
            </button>
            <div class="cmd-group-title">ACCOUNT & ACTIONS</div>
            <button class="cmd-item" id="cmd-refresh">
              ${icons.refresh}
              <span>Refresh Gmail Data</span>
              <kbd>R</kbd>
            </button>
          </div>
          <div class="cmd-palette-footer">
            <span><strong>⌘K</strong> anywhere</span>
            <span><strong>Enter</strong> to select</span>
            <span><strong>Esc</strong> to close</span>
          </div>
        </div>
      </div>
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
      updateActiveNavStates();
      renderContent();
    });
  });

  // Sidebar category shortcuts
  document.querySelectorAll('[data-sidebar-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = 'categories';
      currentCategory = btn.dataset.sidebarCategory;
      updateActiveNavStates();
      renderContent();
    });
  });

  // Mobile bottom navigation switching
  document.querySelectorAll('[data-mobile-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.mobileView;
      if (currentView === 'categories' && !currentCategory) {
        currentCategory = 'all';
      }
      updateActiveNavStates();
      renderContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Mobile search toggle & clear
  const mobileSearchToggle = document.getElementById('mobile-search-toggle');
  const mobileSearchBtn = document.querySelector('[data-mobile-action="search"]');
  const mobileSearchBar = document.getElementById('mobile-search-bar');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchClear = document.getElementById('mobile-search-clear');

  const toggleMobileSearch = () => {
    if (!mobileSearchBar) return;
    const isHidden = mobileSearchBar.style.display === 'none';
    mobileSearchBar.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      mobileSearchInput?.focus();
    } else {
      if (mobileSearchInput) {
        mobileSearchInput.value = '';
        const desktopSearch = document.getElementById('search-input');
        if (desktopSearch) desktopSearch.value = '';
        renderContent();
      }
    }
  };

  mobileSearchToggle?.addEventListener('click', toggleMobileSearch);
  mobileSearchBtn?.addEventListener('click', toggleMobileSearch);

  let mobileSearchTimeout;
  mobileSearchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (mobileSearchClear) {
      mobileSearchClear.style.display = val ? 'flex' : 'none';
    }
    const desktopSearch = document.getElementById('search-input');
    if (desktopSearch) desktopSearch.value = val;
    clearTimeout(mobileSearchTimeout);
    mobileSearchTimeout = setTimeout(() => {
      renderContent(val);
    }, 300);
  });

  mobileSearchClear?.addEventListener('click', () => {
    if (mobileSearchInput) mobileSearchInput.value = '';
    if (mobileSearchClear) mobileSearchClear.style.display = 'none';
    const desktopSearch = document.getElementById('search-input');
    if (desktopSearch) desktopSearch.value = '';
    renderContent('');
    mobileSearchInput?.focus();
  });

  // Mobile stats toggle
  const mobileStatsBtn = document.querySelector('[data-mobile-action="stats"]');
  const statsGrid = document.getElementById('stats-grid');
  mobileStatsBtn?.addEventListener('click', () => {
    if (!statsGrid) return;
    statsGrid.classList.toggle('mobile-hidden');
    if (!statsGrid.classList.contains('mobile-hidden')) {
      statsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  // Search
  let searchTimeout;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderContent(e.target.value);
    }, 300);
  });

  // Command Palette Spotlight (Cmd+K / Ctrl+K)
  const cmdOverlay = document.getElementById('cmd-palette-overlay');
  const cmdInput = document.getElementById('cmd-palette-input');

  const toggleCmdPalette = (open = undefined) => {
    if (!cmdOverlay) return;
    const shouldOpen = open !== undefined ? open : cmdOverlay.style.display === 'none';
    cmdOverlay.style.display = shouldOpen ? 'flex' : 'none';
    if (shouldOpen) {
      cmdInput?.focus();
    } else {
      if (cmdInput) cmdInput.value = '';
    }
  };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCmdPalette();
    }
    if (e.key === 'Escape' && cmdOverlay && cmdOverlay.style.display !== 'none') {
      e.preventDefault();
      toggleCmdPalette(false);
    }
  });

  cmdOverlay?.addEventListener('click', (e) => {
    if (e.target === cmdOverlay) {
      toggleCmdPalette(false);
    }
  });

  cmdInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    const desktopSearch = document.getElementById('search-input');
    if (desktopSearch) desktopSearch.value = val;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderContent(val);
    }, 300);
  });

  document.querySelectorAll('[data-cmd-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.cmdView;
      updateActiveNavStates();
      renderContent();
      toggleCmdPalette(false);
    });
  });

  document.querySelectorAll('[data-cmd-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = 'categories';
      currentCategory = btn.dataset.cmdCat;
      updateActiveNavStates();
      renderContent();
      toggleCmdPalette(false);
    });
  });

  document.getElementById('cmd-refresh')?.addEventListener('click', () => {
    document.getElementById('btn-refresh')?.click();
    toggleCmdPalette(false);
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
  updateActiveNavStates();

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

function updateActiveNavStates() {
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === currentView);
  });
  document.querySelectorAll('[data-mobile-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.mobileView === currentView);
  });
}
