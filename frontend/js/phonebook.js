/* -- Telix.dev - Phonebook -- */
const Phonebook = {
  PAGE_SIZE: 50,
  view: 'categories', // 'categories' | 'list'

  init() {
    this.renderControls();
    this.loadCategories();
  },

  renderControls() {
    const bar = document.getElementById('controls-bar');

    const catOpts = Object.entries(App.CATEGORIES).map(([v, l]) =>
      `<option value="${v}">${l}</option>`
    ).join('');

    const protoOpts = Object.entries(App.PROTOCOLS).map(([v, l]) =>
      `<option value="${v}">${l}</option>`
    ).join('');

    const sortOpts = [
      ['upvotes', 'Top Voted'],
      ['newest', 'Newest'],
      ['name', 'Name A-Z'],
    ].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

    bar.innerHTML = `
      <label for="filter-category">Cat:</label><select id="filter-category" aria-label="Filter by category">${catOpts}</select>
      <label for="filter-protocol">Proto:</label><select id="filter-protocol" aria-label="Filter by protocol">${protoOpts}</select>
      <label for="filter-sort">Sort:</label><select id="filter-sort" aria-label="Sort entries">${sortOpts}</select>
      <label for="search-input" class="sr-only">Search entries</label><input id="search-input" type="search" placeholder="Search..." style="width:20ch" aria-label="Search entries">
    `;

    bar.querySelector('#filter-category').addEventListener('change', (e) => {
      App.state.filters.category = e.target.value;
      App.state.page = 1;
      this.view = 'list';
      this.load();
    });
    bar.querySelector('#filter-protocol').addEventListener('change', (e) => {
      App.state.filters.protocol = e.target.value;
      App.state.page = 1;
      this.view = 'list';
      this.load();
    });
    bar.querySelector('#filter-sort').addEventListener('change', (e) => {
      App.state.filters.sort = e.target.value;
      App.state.page = 1;
      this.load();
    });

    let searchTimer;
    bar.querySelector('#search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        App.state.filters.search = e.target.value;
        App.state.page = 1;
        if (e.target.value) {
          this.view = 'list';
        }
        this.load();
      }, 300);
    });
  },

  showControls(visible) {
    const bar = document.getElementById('controls-bar');
    bar.style.display = visible ? '' : 'none';
  },

  async loadCategories() {
    this.view = 'categories';
    this.showControls(false);
    App.renderStatusBar();
    document.getElementById('phonebook-header').textContent = '';
    document.getElementById('pagination').textContent = '';

    try {
      const data = await App.api('/entries/stats');
      this.renderCategoryMenu(data.categories, data.total, data.online || 0);
      App.announce(`Category menu: ${data.categories.length} categories, ${data.total} total entries, ${data.online || 0} online`);
    } catch (err) {
      document.getElementById('phonebook-list').innerHTML =
        `<div class="loading text-red">Error loading categories: ${App.esc(err.message)}</div>`;
    }
  },

  // Short descriptions for each category
  CAT_DESC: {
    'bbs': 'Bulletin Board Systems - the original online communities',
    'mud': 'Multi-User Dungeons - text-based multiplayer games',
    'game': 'Text adventures, interactive fiction, and more',
    'ascii-art': 'ANSI/ASCII art servers and galleries',
    'network-tool': 'Weather, IP lookups, traceroute, and other tools',
    'sandbox': 'Public shells, tilde servers, shared Unix boxes',
    'irc': 'Internet Relay Chat networks and servers',
    'chat': 'Other chat systems and social spaces',
    'api': 'Interesting curl-able APIs and services',
    'gopher': 'Gopher protocol sites - the web before the web',
    'gemini': 'Gemini capsules - a modern lightweight protocol',
    'finger': 'Finger protocol servers',
    'radio': 'Internet radio streams accessible via CLI',
    'other': 'Everything else worth connecting to',
  },

  renderCategoryMenu(categories, total, online) {
    const el = document.getElementById('phonebook-list');

    let html = '<div class="category-menu" role="listbox" aria-label="Choose a category">';

    // Welcome section
    html += '<div class="cat-welcome">';
    html += '<div class="cat-welcome-title">Welcome to the Terminal Internet</div>';
    html += '<div class="cat-welcome-desc">A directory of interesting places you can connect to -- BBSes, MUDs, Gopher holes, and the weird wonderful corners of the internet most people don\'t know exist.</div>';
    html += '<div class="cat-welcome-feature">Connect directly from your browser -- click any entry and hit Connect to open a live terminal session.</div>';
    html += `<div class="cat-welcome-count">${total} destinations${online ? ` (<span class="text-green">${online} online now</span>)` : ''}. Pick a category to explore:</div>`;
    html += '</div>';

    // "Browse All" button
    html += `<div class="cat-row cat-row-all" role="option" data-category="" tabindex="0">`;
    html += `<span class="cat-row-name">>Browse All (${total})</span>`;
    html += '</div>';

    // Category rows with descriptions
    for (const cat of categories) {
      const label = App.CATEGORIES[cat.category] || cat.category;
      const desc = this.CAT_DESC[cat.category] || '';
      html += `<div class="cat-row" role="option" data-category="${App.esc(cat.category)}" tabindex="0">`;
      html += `<span class="cat-row-name">>${App.esc(label)} <span class="cat-row-count">(${cat.count})</span></span>`;
      if (desc) html += `<span class="cat-row-desc">${App.esc(desc)}</span>`;
      html += '</div>';
    }

    html += '</div>';

    el.innerHTML = html;

    // Click handlers
    el.querySelectorAll('.cat-row').forEach((row) => {
      row.addEventListener('click', () => {
        this.selectCategory(row.dataset.category);
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.selectCategory(row.dataset.category);
        }
      });
    });

    // Focus first item
    const first = el.querySelector('.cat-row');
    if (first) first.focus();
  },

  selectCategory(category) {
    App.state.filters.category = category;
    App.state.filters.search = '';
    App.state.page = 1;
    App.state.selectedIndex = 0;
    this.view = 'list';
    this.showControls(true);
    App.renderStatusBar();

    // Sync the dropdown
    const catSelect = document.getElementById('filter-category');
    if (catSelect) catSelect.value = category;
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    this.load();
  },

  goBack() {
    App.state.filters.category = '';
    App.state.filters.protocol = '';
    App.state.filters.search = '';
    App.state.page = 1;
    App.state.selectedIndex = -1;

    // Reset dropdowns
    const catSelect = document.getElementById('filter-category');
    if (catSelect) catSelect.value = '';
    const protoSelect = document.getElementById('filter-protocol');
    if (protoSelect) protoSelect.value = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    this.loadCategories();
  },

  async load() {
    if (this.view === 'categories') {
      this.loadCategories();
      return;
    }

    this.showControls(true);
    const { filters, page } = App.state;
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.protocol) params.set('protocol', filters.protocol);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.search) params.set('search', filters.search);
    params.set('page', page);

    try {
      const data = await App.api('/entries?' + params);
      App.state.entries = data.entries;
      App.state.total = data.total;
      App.state.pages = data.pages;
      App.state.page = data.page;
      if (App.state.selectedIndex >= data.entries.length) {
        App.state.selectedIndex = Math.max(0, data.entries.length - 1);
      }
      if (App.state.selectedIndex < 0 && data.entries.length > 0) {
        App.state.selectedIndex = 0;
      }
      this.render();
      App.announce(`Showing ${data.entries.length} of ${data.total} entries, page ${data.page} of ${data.pages}`);
    } catch (err) {
      document.getElementById('phonebook-list').innerHTML =
        `<div class="loading text-red">Error loading entries: ${App.esc(err.message)}</div>`;
    }
  },

  render() {
    this.renderHeader();
    this.renderList();
    this.renderPagination();
  },

  renderHeader() {
    const el = document.getElementById('phonebook-header');
    const backBtn = '<span class="header-back" role="button" tabindex="0" aria-label="Back to categories">[Back]</span> ';
    const sep = ' | ';
    el.innerHTML = backBtn + App.pad('', 2) + sep + App.pad('Name', 32) + `<span class="col-proto">${sep}${App.pad('Proto', 8)}</span><span class="col-cat">${sep}${App.pad('Category', 12)}</span>` + sep + '^';

    el.querySelector('.header-back').addEventListener('click', () => this.goBack());
    el.querySelector('.header-back').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.goBack();
      }
    });
  },

  renderList() {
    const el = document.getElementById('phonebook-list');
    const { entries, selectedIndex } = App.state;

    if (entries.length === 0) {
      el.innerHTML = '<div class="loading" role="status">No entries found.</div>';
      return;
    }

    el.innerHTML = entries.map((entry, i) => {
      const isOnline = entry.status === 'online';
      const isOffline = entry.status === 'offline';
      const statusIcon = isOnline ? '*' : isOffline ? 'o' : 'o';
      const statusClass = entry.status || 'unknown';
      const selected = i === selectedIndex;
      const catLabel = App.CATEGORIES[entry.category] || entry.category;

      // Build name with offline indicator
      let displayName = entry.name;
      if (isOffline) displayName += ' (offline)';

      const namePad = 32;
      const nameStr = displayName.length > namePad ? displayName.slice(0, namePad - 1) + '..' : displayName;
      const namePadded = nameStr + ' '.repeat(Math.max(0, namePad - nameStr.length));

      // Color offline names red via span
      const nameHtml = isOffline
        ? `<span class="entry-name">${App.esc(nameStr)}</span><span class="entry-offline-tag"></span>` + ' '.repeat(Math.max(0, namePad - nameStr.length))
        : App.esc(namePadded);

      const sep = ' <span class="col-sep">|</span> ';
      const row = `<span class="entry-status ${statusClass}"> ${statusIcon}</span> ${sep}${nameHtml}<span class="col-proto">${sep}${App.esc(App.pad(entry.protocol, 8))}</span><span class="col-cat">${sep}${App.esc(App.pad(catLabel, 12))}</span>${sep}<span class="col-votes">${App.esc(String(entry.upvotes || 0))}</span>`;

      return `<div class="entry-row${selected ? ' selected' : ''}${isOffline ? ' entry-offline' : ''}" role="option" aria-selected="${selected}" data-index="${i}" tabindex="${selected ? '0' : '-1'}" aria-label="${App.esc(entry.name)}, ${entry.status || 'unknown'}, ${App.esc(entry.protocol)}, ${App.esc(entry.host)}:${App.esc(String(entry.port))}">${row}</div>`;
    }).join('');

    // Click handlers
    el.querySelectorAll('.entry-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.index);
        App.state.selectedIndex = idx;
        this.renderList();
        Detail.show(App.state.entries[idx]);
      });
    });

    // Scroll selected into view
    const selectedRow = el.querySelector('.entry-row.selected');
    if (selectedRow) {
      selectedRow.scrollIntoView({ block: 'nearest' });
    }
  },

  renderPagination() {
    const el = document.getElementById('pagination');
    const { page, pages, total } = App.state;
    if (pages <= 1) {
      el.textContent = ` ${total} entries`;
      return;
    }
    el.innerHTML = `
      Page ${page}/${pages} (${total} entries)
      ${page > 1 ? ' <button type="button" class="btn" id="page-prev" aria-label="Previous page">[Prev]</button>' : ''}
      ${page < pages ? ' <button type="button" class="btn" id="page-next" aria-label="Next page">[Next]</button>' : ''}
    `;
    const prev = document.getElementById('page-prev');
    const next = document.getElementById('page-next');
    if (prev) prev.addEventListener('click', () => { App.state.page--; this.load(); });
    if (next) next.addEventListener('click', () => { App.state.page++; this.load(); });
  },

  handleKey(e) {
    // Category menu keyboard navigation
    if (this.view === 'categories') {
      const rows = document.querySelectorAll('.cat-row');
      if (!rows.length) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const current = document.activeElement;
        const idx = Array.from(rows).indexOf(current);
        const next = rows[Math.min(idx + 1, rows.length - 1)];
        if (next) next.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const current = document.activeElement;
        const idx = Array.from(rows).indexOf(current);
        const prev = rows[Math.max(idx - 1, 0)];
        if (prev) prev.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const current = document.activeElement;
        if (current && current.classList.contains('cat-row')) {
          this.selectCategory(current.dataset.category);
        }
      }
      return;
    }

    // List view keyboard navigation
    const { entries, selectedIndex } = App.state;
    if (!entries.length) return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      App.state.selectedIndex = Math.min(selectedIndex + 1, entries.length - 1);
      this.renderList();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      App.state.selectedIndex = Math.max(selectedIndex - 1, 0);
      this.renderList();
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      App.state.selectedIndex = Math.min(selectedIndex + 20, entries.length - 1);
      this.renderList();
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      App.state.selectedIndex = Math.max(selectedIndex - 20, 0);
      this.renderList();
    } else if (e.key === 'Home') {
      e.preventDefault();
      App.state.selectedIndex = 0;
      this.renderList();
    } else if (e.key === 'End') {
      e.preventDefault();
      App.state.selectedIndex = entries.length - 1;
      this.renderList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < entries.length) {
        Detail.show(entries[selectedIndex]);
      }
    }
  },
};
