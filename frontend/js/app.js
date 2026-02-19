/* -- Telix.dev -App Core -- */
const App = {
  state: {
    entries: [],
    total: 0,
    page: 1,
    pages: 1,
    selectedIndex: -1,
    filters: { category: '', protocol: '', status: '', sort: 'upvotes', search: '' },
    modal: null, // 'detail' | 'submit' | 'help'
    currentEntry: null,
  },

  CATEGORIES: {
    '': 'All',
    'bbs': 'BBS',
    'mud': 'MUD',
    'game': 'Game',
    'ascii-art': 'ASCII Art',
    'network-tool': 'Net Tool',
    'sandbox': 'Sandbox',
    'irc': 'IRC',
    'chat': 'Chat',
    'api': 'API',
    'gopher': 'Gopher',
    'gemini': 'Gemini',
    'finger': 'Finger',
    'radio': 'Radio',
    'other': 'Other',
  },

  PROTOCOLS: {
    '': 'All',
    'telnet': 'Telnet',
    'ssh': 'SSH',
    'http': 'HTTP',
    'https': 'HTTPS',
    'raw': 'Raw',
    'gopher': 'Gopher',
    'gemini': 'Gemini',
    'finger': 'Finger',
  },

  // -- API Helpers --
  async api(path, opts = {}) {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  // -- Box Drawing Helpers --
  box: {
    h: '\u2500', v: '\u2502',
    tl: '\u250C', tr: '\u2510', bl: '\u2514', br: '\u2518',
    lt: '\u251C', rt: '\u2524', tt: '\u252C', bt: '\u2534', cross: '\u253C',

    hLine(width) {
      return this.h.repeat(width);
    },

    topBar(title, width) {
      const inner = width - 2;
      if (!title) return this.tl + this.hLine(inner) + this.tr;
      const pad = inner - title.length - 2;
      return this.tl + this.h + ' ' + title + ' ' + this.hLine(Math.max(0, pad - 1)) + this.tr;
    },

    bottomBar(width) {
      return this.bl + this.hLine(width - 2) + this.br;
    },
  },

  // -- Pad / Truncate --
  pad(str, len) {
    str = String(str || '');
    if (str.length > len) return str.slice(0, len - 1) + '\u2026';
    return str + ' '.repeat(Math.max(0, len - str.length));
  },

  padRight(str, len) {
    return this.pad(str, len);
  },

  // -- Render --
  init() {
    this.renderTitleBar();
    this.renderStatusBar();
    Phonebook.init();
    this.bindKeys();
    this.checkDeepLink();
  },

  async checkDeepLink() {
    const hash = window.location.hash;
    const match = hash.match(/^#entry-(\d+)$/);
    if (match) {
      try {
        const entry = await this.api(`/entries/${match[1]}`);
        Detail.show(entry);
      } catch { /* entry not found, ignore */ }
    }
  },

  renderTitleBar() {
    const el = document.getElementById('title-bar');
    el.innerHTML = ' <a href="/" class="title-link">TELIX.DEV</a> - The Terminal Internet ';
  },

  renderStatusBar() {
    const el = document.getElementById('status-bar');
    const showListBtns = Phonebook.view === 'list';
    el.innerHTML = `
      <button class="status-btn" id="btn-help" aria-label="Help"><span class="status-key">?</span><span class="status-label">Help</span></button>
      ${showListBtns ? '<button class="status-btn" id="btn-refresh" aria-label="Refresh list"><span class="status-key">R</span><span class="status-label">Refresh</span></button>' : ''}
      ${showListBtns ? '<button class="status-btn" id="btn-search" aria-label="Focus search"><span class="status-key">/</span><span class="status-label">Search</span></button>' : ''}
      <button class="status-btn" id="btn-random" aria-label="Random entry"><span class="status-key">!</span><span class="status-label">Random</span></button>
      <button class="status-btn" id="btn-submit" aria-label="Submit entry"><span class="status-key">S</span><span class="status-label">Submit</span></button>
    `;
    el.querySelector('#btn-help').addEventListener('click', () => this.showHelp());
    const refreshBtn = el.querySelector('#btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        Phonebook.load();
        const lbl = el.querySelector('#btn-refresh .status-label');
        lbl.textContent = 'Done!';
        setTimeout(() => { lbl.textContent = 'Refresh'; }, 1000);
      });
    }
    const searchBtn = el.querySelector('#btn-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const search = document.getElementById('search-input');
        if (search) search.focus();
      });
    }
    el.querySelector('#btn-random').addEventListener('click', () => this.randomDial());
    el.querySelector('#btn-submit').addEventListener('click', () => this.showSubmit());
  },

  async randomDial() {
    try {
      const entry = await this.api('/entries/random');
      Detail.show(entry);
    } catch {
      this.announce('No online entries found');
    }
  },

  announce(message) {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  },

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      // Don't capture keys when terminal is active
      if (typeof TerminalView !== 'undefined' && TerminalView.active) return;

      // Don't capture keys when typing in inputs
      const tag = e.target.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === '!' && !inInput) {
        e.preventDefault();
        this.randomDial();
      } else if ((e.key === 's' || e.key === 'S') && !inInput && !this.state.modal) {
        e.preventDefault();
        this.showSubmit();
      } else if (e.key === 'F1' || (e.key === '?' && !inInput)) {
        e.preventDefault();
        this.showHelp();
      } else if (e.key === 'F5' || ((e.key === 'r' || e.key === 'R') && !inInput && !this.state.modal)) {
        e.preventDefault();
        Phonebook.load();
        const lbl = document.querySelector('#btn-refresh .status-label');
        if (lbl) { lbl.textContent = 'Done!'; setTimeout(() => { lbl.textContent = 'Refresh'; }, 1000); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
      } else if (e.key === '/' && !inInput && !this.state.modal) {
        e.preventDefault();
        const search = document.getElementById('search-input');
        if (search) search.focus();
      } else if (!inInput && !this.state.modal) {
        Phonebook.handleKey(e);
      }
    });
  },

  // -- Modal Management --
  showModal(title, bodyHtml) {
    this.closeModal();
    this._previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });
    const titleId = 'modal-title-' + Date.now();
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="modal-title" id="${titleId}">${title}</div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.state.modal = true;

    // Scroll modal to top
    const modal = overlay.querySelector('.modal');
    if (modal) modal.scrollTop = 0;

    // Focus the modal itself (not a link inside, which would scroll down)
    if (modal) { modal.setAttribute('tabindex', '-1'); modal.focus(); }

    // Trap focus within modal (WCAG 2.4.3)
    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusableEls = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusableEls.length) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    return overlay.querySelector('.modal-body');
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
    this.state.modal = null;
    // Clear deep link hash
    if (window.location.hash.startsWith('#entry-')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    // Restore focus (WCAG 2.4.3)
    if (this._previousFocus) {
      this._previousFocus.focus();
      this._previousFocus = null;
    }
  },

  // -- Submit Modal --
  showSubmit() {
    const catOpts = Object.entries(this.CATEGORIES)
      .filter(([v]) => v)
      .map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    const protoOpts = Object.entries(this.PROTOCOLS)
      .filter(([v]) => v)
      .map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

    const html = `
      <form id="submit-form">
        <div class="form-group">
          <label for="sub-name">Name *</label>
          <input type="text" id="sub-name" maxlength="64" required placeholder="e.g. Synchronet BBS">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="sub-host">Host *</label>
            <input type="text" id="sub-host" maxlength="128" required placeholder="e.g. bbs.example.com">
          </div>
          <div class="form-group" style="max-width:10ch">
            <label for="sub-port">Port *</label>
            <input type="number" id="sub-port" min="1" max="65535" required value="23">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="sub-proto">Protocol *</label>
            <select id="sub-proto">${protoOpts}</select>
          </div>
          <div class="form-group">
            <label for="sub-cat">Category *</label>
            <select id="sub-cat">${catOpts}</select>
          </div>
        </div>
        <div class="form-group">
          <label for="sub-desc">Description * <span class="text-dim">(280 chars max)</span></label>
          <textarea id="sub-desc" maxlength="280" rows="3" required placeholder="What is this? What makes it interesting?"></textarea>
        </div>
        <div class="form-group">
          <label for="sub-tags">Tags <span class="text-dim">(comma separated, optional)</span></label>
          <input type="text" id="sub-tags" placeholder="e.g. retro, games, fidonet">
        </div>
        <div class="form-group">
          <label for="sub-url">Website URL <span class="text-dim">(optional)</span></label>
          <input type="url" id="sub-url" placeholder="https://...">
        </div>
        <div class="form-group" id="turnstile-container">
          <div class="cf-turnstile" data-sitekey="${document.querySelector('meta[name=turnstile-site-key]')?.content || ''}" data-theme="dark"></div>
        </div>
        <div id="submit-error" class="form-error" style="display:none"></div>
        <div class="form-actions">
          <button type="submit" class="btn btn-connect" id="sub-btn">> Submit Entry</button>
          <button type="button" class="btn" id="sub-cancel">Cancel [Esc]</button>
        </div>
      </form>
    `;

    const body = this.showModal(' Submit New Entry ', html);
    body.querySelector('#sub-cancel').addEventListener('click', () => this.closeModal());

    // Load Turnstile widget
    if (!document.getElementById('turnstile-script')) {
      const s = document.createElement('script');
      s.id = 'turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      document.head.appendChild(s);
    } else if (window.turnstile) {
      window.turnstile.render('#turnstile-container .cf-turnstile');
    }

    body.querySelector('#submit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = body.querySelector('#sub-btn');
      const errEl = body.querySelector('#submit-error');
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      errEl.style.display = 'none';

      const turnstileInput = body.querySelector('[name="cf-turnstile-response"]');
      const payload = {
        name: body.querySelector('#sub-name').value,
        host: body.querySelector('#sub-host').value,
        port: parseInt(body.querySelector('#sub-port').value),
        protocol: body.querySelector('#sub-proto').value,
        category: body.querySelector('#sub-cat').value,
        description: body.querySelector('#sub-desc').value,
        tags: body.querySelector('#sub-tags').value,
        url: body.querySelector('#sub-url').value || undefined,
        'cf-turnstile-response': turnstileInput ? turnstileInput.value : '',
      };

      try {
        const result = await this.api('/entries', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        this.closeModal();
        this.announce('Entry submitted successfully!');
        // Show a quick confirmation then reload
        const statusEl = document.getElementById('pagination');
        if (statusEl) {
          statusEl.innerHTML = '<span class="text-green">Entry submitted! It will appear after a status check.</span>';
          setTimeout(() => Phonebook.load(), 2000);
        }
      } catch (err) {
        errEl.textContent = err.message || 'Submission failed';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '> Submit Entry';
        // Reset turnstile
        if (window.turnstile) window.turnstile.reset();
      }
    });
  },

  // -- Help Modal --
  showHelp() {
    const help = '<div style="white-space:pre;line-height:1.4">' +
'<span class="text-yellow">TELIX.DEV -- The Terminal Internet</span>\n' +
'\n' +
'<span class="text-cyan">What is this?</span>\n' +
'  A community-curated directory of\n' +
'  interesting places you can connect\n' +
'  to from your terminal. BBSes, MUDs,\n' +
'  Gopher holes, Gemini capsules, IRC,\n' +
'  ASCII art servers, network tools,\n' +
'  and the weird wonderful corners of\n' +
'  the internet most people never see.\n' +
'\n' +
'<span class="text-cyan">Connect from your browser</span>\n' +
'  Click any entry and hit Connect to\n' +
'  open a live terminal session right\n' +
'  here -- no software needed.\n' +
'\n' +
'  Sessions have a 20-minute limit to\n' +
'  keep resources fair for everyone.\n' +
'  Hit Disconnect when you\'re done.\n' +
'\n' +
'<span class="text-cyan">Keyboard Shortcuts:</span>\n' +
'  <span class="text-yellow">Up/Down</span>    Navigate entries\n' +
'  <span class="text-yellow">PgUp/PgDn</span>  Scroll page\n' +
'  <span class="text-yellow">Enter</span>      View entry details\n' +
'  <span class="text-yellow">Esc</span>        Back / Close modal\n' +
'  <span class="text-yellow">?</span>          This help screen\n' +
'  <span class="text-yellow">R</span>          Refresh list\n' +
'  <span class="text-yellow">/</span>          Focus search\n' +
'  <span class="text-yellow">!</span>          Random entry\n' +
'  <span class="text-yellow">S</span>          Submit new entry\n' +
'\n' +
'<span class="text-cyan">Submit an entry:</span>\n' +
'  Know a BBS, MUD, or other terminal\n' +
'  service? Press S to add it to the\n' +
'  directory.\n' +
'\n' +
'<span class="text-cyan">API:</span>\n' +
'  <a href="/api/entries" target="_blank" class="text-cyan">/api/entries</a> - Browse entries\n' +
'  <a href="/api/entries/stats" target="_blank" class="text-cyan">/api/entries/stats</a> - Category stats\n' +
'  <a href="/api/entries/random" target="_blank" class="text-cyan">/api/entries/random</a> - Random entry\n' +
'\n' +
'<span class="text-cyan">About:</span>\n' +
'<span class="text-dim">  Inspired by Telix, the DOS-era\n' +
'  terminal program with a phonebook\n' +
'  of BBS numbers you\'d scroll through,\n' +
'  pick one, and connect. Telix.dev\n' +
'  brings that to the modern web.\n' +
'\n' +
'  Status checks run daily. Entries\n' +
'  that stay offline get auto-hidden.</span>\n' +
'\n' +
'<span class="text-cyan">Contact:</span>\n' +
'  <span class="text-yellow">sysop@telix.dev</span>\n' +
'\n' +
'  <a href="#" id="help-privacy" class="text-cyan">Privacy Policy</a>  <a href="#" id="help-terms" class="text-cyan">Terms of Use</a>\n' +
'\n' +
'<span class="text-green">  Press Esc to close</span>' +
'</div>';
    const body = this.showModal(' Help ', help);
    body.querySelector('#help-privacy').addEventListener('click', (e) => { e.preventDefault(); this.showPrivacy(); });
    body.querySelector('#help-terms').addEventListener('click', (e) => { e.preventDefault(); this.showTerms(); });
  },

  showPrivacy() {
    const text = '<div style="white-space:pre;line-height:1.4">' +
'<span class="text-yellow">PRIVACY POLICY</span>\n' +
'<span class="text-dim">Last updated: February 2026</span>\n' +
'\n' +
'<span class="text-cyan">What we collect:</span>\n' +
'  - Your IP address, used for vote\n' +
'    tracking and rate limiting. We do\n' +
'    not link IPs to any identity.\n' +
'  - Basic analytics via Google Analytics\n' +
'    (pages visited, referrer, device).\n' +
'  - Cloudflare may collect standard\n' +
'    connection data (CDN/security).\n' +
'\n' +
'<span class="text-cyan">What we don\'t collect:</span>\n' +
'  - No accounts, no emails, no names.\n' +
'  - No cookies beyond what Cloudflare\n' +
'    and Analytics set.\n' +
'  - No tracking across other sites.\n' +
'\n' +
'<span class="text-cyan">Terminal connections:</span>\n' +
'  When you use the in-browser terminal,\n' +
'  your connection is proxied through our\n' +
'  server. We do not log, store, or\n' +
'  inspect terminal session content.\n' +
'\n' +
'<span class="text-cyan">Third-party services:</span>\n' +
'  - Cloudflare (CDN, security)\n' +
'  - Google Analytics (usage stats)\n' +
'\n' +
'<span class="text-cyan">Contact:</span>\n' +
'  <span class="text-yellow">sysop@telix.dev</span>\n' +
'\n' +
'<span class="text-green">  Press Esc to close</span>' +
'</div>';
    this.showModal(' Privacy Policy ', text);
  },

  showTerms() {
    const text = '<div style="white-space:pre;line-height:1.4">' +
'<span class="text-yellow">TERMS OF USE</span>\n' +
'<span class="text-dim">Last updated: February 2026</span>\n' +
'\n' +
'<span class="text-cyan">The short version:</span>\n' +
'  Don\'t be a jerk. Don\'t abuse the\n' +
'  service. Have fun exploring.\n' +
'\n' +
'<span class="text-cyan">The directory:</span>\n' +
'  Telix.dev lists third-party services\n' +
'  we don\'t own or control. We make no\n' +
'  guarantees about listed services --\n' +
'  they may go offline, change, or be\n' +
'  unsuitable for all audiences. Connect\n' +
'  at your own discretion.\n' +
'\n' +
'<span class="text-cyan">The terminal proxy:</span>\n' +
'  The in-browser terminal connects you\n' +
'  to third-party servers. You are\n' +
'  responsible for your own actions on\n' +
'  those systems. Do not use the proxy\n' +
'  to attack, scan, or abuse any system.\n' +
'\n' +
'<span class="text-cyan">Voting and flagging:</span>\n' +
'  Don\'t spam votes or flags. Automated\n' +
'  or abusive use will get you blocked.\n' +
'\n' +
'<span class="text-cyan">We reserve the right to:</span>\n' +
'  - Remove or hide any entry\n' +
'  - Block abusive users\n' +
'  - Modify these terms at any time\n' +
'\n' +
'<span class="text-cyan">Contact:</span>\n' +
'  <span class="text-yellow">sysop@telix.dev</span>\n' +
'\n' +
'<span class="text-green">  Press Esc to close</span>' +
'</div>';
    this.showModal(' Terms of Use ', text);
  },

  // -- Escape HTML --
  esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
