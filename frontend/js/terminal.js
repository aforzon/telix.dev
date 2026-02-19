/* -- Telix.dev - In-Browser Terminal -- */
var TerminalView = {
  ws: null,
  term: null,
  fitAddon: null,
  _timerInterval: null,
  active: false,

  canConnect: function(entry) {
    return entry.protocol === 'telnet' || entry.protocol === 'raw';
  },

  connect: function(entry) {
    if (this.active) return;
    this.active = true;
    App.closeModal();

    document.body.classList.add('terminal-active');

    var overlay = document.createElement('div');
    overlay.id = 'terminal-overlay';
    overlay.innerHTML =
      '<div id="terminal-panel">' +
        '<div id="terminal-title-bar">' +
          '<span class="terminal-title-text">' + App.esc(entry.name) + ' - ' + App.esc(entry.host) + ':' + entry.port + '</span>' +
          '<span id="terminal-timer" class="terminal-timer"></span>' +
          '<button id="terminal-close" class="btn">Disconnect</button>' +
        '</div>' +
        '<div id="terminal-container"></div>' +
        '<div id="terminal-input-wrap">' +
          '<form id="terminal-form" autocomplete="off">' +
            '<input type="text" id="terminal-cmd" placeholder="Type command and press Enter" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
            '<button type="submit" class="btn" id="terminal-send">Send</button>' +
            '<button type="button" class="btn" id="terminal-char-btn">Char</button>' +
          '</form>' +
        '</div>' +
        '<div id="terminal-status-bar">' +
          '<span id="terminal-status">Connecting...</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var self = this;
    var cmdInput = document.getElementById('terminal-cmd');
    var form = document.getElementById('terminal-form');
    var charBtn = document.getElementById('terminal-char-btn');
    this.charMode = false;

    var isMobile = window.innerWidth <= 768;
    try {
      this.term = new Terminal({
        cursorBlink: true,
        fontFamily: "'DOS VGA', 'Courier New', monospace",
        fontSize: isMobile ? 12 : 16,
        cols: isMobile ? 40 : 100,
        rows: isMobile ? 20 : 30,
        scrollback: 500,
        disableStdin: true,
        theme: {
          background: '#000000',
          foreground: '#AAAAAA',
          cursor: '#FFFFFF',
          selectionBackground: '#00AAAA',
          black: '#000000',
          red: '#AA0000',
          green: '#00AA00',
          yellow: '#AA5500',
          blue: '#0000AA',
          magenta: '#AA00AA',
          cyan: '#00AAAA',
          white: '#AAAAAA',
          brightBlack: '#555555',
          brightRed: '#FF5555',
          brightGreen: '#55FF55',
          brightYellow: '#FFFF55',
          brightBlue: '#5555FF',
          brightMagenta: '#FF55FF',
          brightCyan: '#55FFFF',
          brightWhite: '#FFFFFF',
        },
      });

      this.fitAddon = new FitAddon.FitAddon();
      this.term.loadAddon(this.fitAddon);

      var container = document.getElementById('terminal-container');
      this.term.open(container);
    } catch (err) {
      var statusEl = document.getElementById('terminal-status');
      if (statusEl) statusEl.textContent = 'Terminal init error: ' + err.message;
      return;
    }

    // Line mode: send on form submit (Enter)
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!self.ws || self.ws.readyState !== WebSocket.OPEN) return;
      var val = cmdInput.value;
      self.ws.send(val + '\r');
      cmdInput.value = '';
      cmdInput.focus();
    });

    // Char mode: send each keypress immediately
    var specialKeys = {
      'Backspace': '\x7f',
      'Delete': '\x1b[3~',
      'Escape': '\x1b',
      'Tab': '\t',
      'ArrowUp': '\x1b[A',
      'ArrowDown': '\x1b[B',
      'ArrowRight': '\x1b[C',
      'ArrowLeft': '\x1b[D',
      'Home': '\x1b[H',
      'End': '\x1b[F',
      'PageUp': '\x1b[5~',
      'PageDown': '\x1b[6~',
    };

    cmdInput.addEventListener('keydown', function(e) {
      if (!self.charMode) return;
      if (!self.ws || self.ws.readyState !== WebSocket.OPEN) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        self.ws.send('\r');
        cmdInput.value = '';
        return;
      }

      if (specialKeys[e.key]) {
        e.preventDefault();
        self.ws.send(specialKeys[e.key]);
        return;
      }

      // Ctrl+key combos (Ctrl+C, Ctrl+D, etc.)
      if (e.ctrlKey && e.key.length === 1) {
        e.preventDefault();
        var code = e.key.toUpperCase().charCodeAt(0) - 64;
        if (code >= 0 && code <= 31) {
          self.ws.send(String.fromCharCode(code));
        }
        return;
      }

      // Regular printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        self.ws.send(e.key);
      }
    });

    // Toggle Char mode
    charBtn.addEventListener('click', function() {
      self.charMode = !self.charMode;
      charBtn.classList.toggle('char-active', self.charMode);
      var statusEl = document.getElementById('terminal-status');
      if (self.charMode) {
        cmdInput.placeholder = 'Char mode: each keypress sent immediately';
        cmdInput.value = '';
        if (statusEl) statusEl.textContent = 'Connected | Char mode: keys sent immediately (backspace, arrows work)';
      } else {
        cmdInput.placeholder = 'Type command and press Enter';
        if (statusEl) statusEl.textContent = 'Connected | Line mode: type command, press Enter';
      }
      cmdInput.focus();
    });

    // Click terminal area to focus input
    document.getElementById('terminal-container').addEventListener('click', function() {
      cmdInput.focus();
    });

    // WebSocket connection
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(proto + '//' + location.host + '/ws/terminal?id=' + entry.id);
    this.ws.binaryType = 'arraybuffer';

    // Refit terminal on window resize (orientation change, keyboard show/hide)
    this._resizeHandler = function() {
      setTimeout(function() {
        try { self.fitAddon.fit(); } catch(e) {}
      }, 100);
    };
    window.addEventListener('resize', this._resizeHandler);

    // Handle visualViewport changes (mobile keyboard)
    if (window.visualViewport) {
      this._viewportHandler = function() {
        setTimeout(function() {
          try { self.fitAddon.fit(); } catch(e) {}
        }, 100);
      };
      window.visualViewport.addEventListener('resize', this._viewportHandler);
    }

    this.ws.onopen = function() {
      var statusEl = document.getElementById('terminal-status');
      if (statusEl) statusEl.textContent = 'Connected | Line mode: type command, press Enter';
      setTimeout(function() {
        try { self.fitAddon.fit(); } catch(e) {}
        cmdInput.focus();
      }, 200);
    };

    this.ws.onmessage = function(e) {
      if (e.data instanceof ArrayBuffer) {
        self.term.write(new Uint8Array(e.data));
      } else {
        self.term.write(e.data);
      }
    };

    this.ws.onclose = function(e) {
      var reason = e.reason || 'Connection closed';
      if (self.term) self.term.write('\r\n\x1b[1;33m--- ' + reason + ' ---\x1b[0m\r\n');
      var statusEl = document.getElementById('terminal-status');
      if (statusEl) statusEl.textContent = 'Disconnected: ' + reason;
    };

    this.ws.onerror = function() {
      if (self.term) self.term.write('\r\n\x1b[1;31m--- Connection error ---\x1b[0m\r\n');
    };

    // Session countdown timer (20 min max)
    var startTime = Date.now();
    var maxSession = 20 * 60 * 1000;
    this._timerInterval = setInterval(function() {
      var elapsed = Date.now() - startTime;
      var remaining = Math.max(0, maxSession - elapsed);
      var mins = Math.floor(remaining / 60000);
      var secs = Math.floor((remaining % 60000) / 1000);
      var timerEl = document.getElementById('terminal-timer');
      if (timerEl) {
        timerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
        if (remaining < 60000) timerEl.style.color = '#FF5555';
      }
    }, 1000);

    // Disconnect button
    document.getElementById('terminal-close').addEventListener('click', function() {
      self.disconnect();
    });

    // Close on overlay background click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) self.disconnect();
    });

    // Focus input immediately
    cmdInput.focus();
  },

  disconnect: function() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._viewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._viewportHandler);
      this._viewportHandler = null;
    }
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.term) {
      this.term.dispose();
      this.term = null;
    }
    this.fitAddon = null;
    this.active = false;
    document.body.classList.remove('terminal-active');

    var overlay = document.getElementById('terminal-overlay');
    if (overlay) overlay.remove();
  },
};
