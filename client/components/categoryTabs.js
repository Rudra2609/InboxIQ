/**
 * Category Tabs — horizontal tab bar with animated indicators for filtering emails.
 */

const CATEGORIES = [
  { id: 'all', label: 'All Emails', color: 'var(--color-accent)' },
  { id: 'primary', label: 'Primary', color: 'var(--cat-primary)' },
  { id: 'social', label: 'Social', color: 'var(--cat-social)' },
  { id: 'promotions', label: 'Promotions', color: 'var(--cat-promotions)' },
  { id: 'updates', label: 'Updates', color: 'var(--cat-updates)' },
];

/**
 * Render the category tabs bar.
 * @param {string} activeCategory - Currently active category ID
 * @param {object} counts - Map of category to count { primary: 5, social: 3, ... }
 * @returns {string}
 */
export function renderCategoryTabs(activeCategory = 'all', counts = {}) {
  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return `
    <div class="category-tabs" role="tablist" aria-label="Email categories">
      ${CATEGORIES.map(
        (cat) => `
        <button
          class="category-tab ${activeCategory === cat.id ? 'active' : ''}"
          role="tab"
          aria-selected="${activeCategory === cat.id}"
          data-category="${cat.id}"
          id="tab-${cat.id}"
        >
          <span class="category-tab-dot" style="background:${cat.color}"></span>
          ${cat.label}
          <span class="category-tab-count">${cat.id === 'all' ? totalCount : counts[cat.id] || 0}</span>
        </button>
      `
      ).join('')}
    </div>
  `;
}

/**
 * Initialize tab switching.
 * @param {function} onTabChange - Callback with (categoryId) when tab is clicked
 */
export function initCategoryTabs(onTabChange) {
  document.querySelectorAll('.category-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;

      // Update active state
      document.querySelectorAll('.category-tab').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      if (onTabChange) onTabChange(category);
    });
  });
}
