/* -- Telix.dev -Entry Detail -- */
const Detail = {
  getConnectionCmd(entry) {
    const cmds = {
      telnet: `telnet ${entry.host} ${entry.port}`,
      ssh: `ssh ${entry.host} -p ${entry.port}`,
      http: `${entry.protocol}://${entry.host}:${entry.port}`,
      https: `${entry.protocol}://${entry.host}:${entry.port}`,
      gopher: `lynx gopher://${entry.host}:${entry.port}`,
      gemini: `gemini://${entry.host}:${entry.port}`,
      finger: `finger @${entry.host}`,
      raw: `nc ${entry.host} ${entry.port}`,
    };
    return cmds[entry.protocol] || `nc ${entry.host} ${entry.port}`;
  },

  async show(entry) {
    const cmd = this.getConnectionCmd(entry);
    const statusIcon = entry.status === 'online' ? '*'
      : entry.status === 'offline' ? 'o' : 'o';
    const statusClass = entry.status || 'unknown';
    const statusText = entry.status || 'unknown';
    const responseTime = entry.response_time ? `${entry.response_time}ms` : '-';
    const lastChecked = entry.last_checked
      ? new Date(entry.last_checked).toLocaleString()
      : 'Never';

    let tags = '';
    try {
      const arr = JSON.parse(entry.tags || '[]');
      tags = arr.map(t => `<span>#${App.esc(t)}</span>`).join('');
    } catch { tags = ''; }

    const catLabel = App.CATEGORIES[entry.category] || entry.category;

    const html = `
      <div class="detail-field">
        <span class="detail-label">Status: </span>
        <span class="entry-status ${statusClass}">${statusIcon}</span>
        <span class="detail-value">${App.esc(statusText)} (${responseTime})</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Protocol: </span>
        <span class="detail-value">${App.esc(entry.protocol)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Host: </span>
        <span class="detail-value">${App.esc(entry.host)}:${App.esc(String(entry.port))}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Category: </span>
        <span class="detail-value">${App.esc(catLabel)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Description: </span>
        <span class="detail-value">${App.esc(entry.description)}</span>
      </div>
      ${entry.long_desc ? `<div class="detail-field">
        <span class="detail-value">${App.esc(entry.long_desc)}</span>
      </div>` : ''}
      <div class="detail-field">
        <span class="detail-label">Connect: </span>
        <span class="detail-cmd" id="detail-cmd" title="Click to copy" role="button" tabindex="0" aria-label="Connection command: ${App.esc(cmd)}. Press Enter to copy.">${App.esc(cmd)}</span>
      </div>
      ${entry.url ? `<div class="detail-field">
        <span class="detail-label">URL: </span>
        <a href="${App.esc(entry.url)}" target="_blank" rel="noopener" class="text-cyan">${App.esc(entry.url)}</a>
      </div>` : ''}
      ${tags ? `<div class="detail-field detail-tags">
        <span class="detail-label">Tags: </span>${tags}
      </div>` : ''}
      <div class="detail-field">
        <span class="detail-label">Last Checked: </span>
        <span class="detail-value text-dim">${lastChecked}</span>
      </div>
      ${entry.protocol === 'ssh' ? '<div class="detail-field"><span class="text-dim">SSH requires a terminal client like <span class="text-yellow">PuTTY</span> (Windows), <span class="text-yellow">Terminal</span> (Mac/Linux), or a mobile SSH app. Browser connect is not available for SSH.</span></div>' : ''}
      <p> </p>
      <div class="form-actions">
        ${TerminalView.canConnect(entry) ? '<button type="button" class="btn btn-connect" id="detail-connect" aria-label="Connect in browser terminal">> Connect</button>' : ''}
        ${entry.protocol === 'gopher' ? '<a href="https://gopher.tildeverse.org//' + App.esc(entry.host) + '/' + (parseInt(entry.port, 10) !== 70 ? ':' + parseInt(entry.port, 10) : '') + '" target="_blank" rel="noopener" class="btn btn-connect" aria-label="Browse via Gopher proxy">> Browse</a>' : ''}
        <button type="button" class="upvote-btn btn" id="detail-upvote" aria-label="Upvote this entry">^Upvote (${entry.upvotes || 0})</button>
        <button type="button" class="btn" id="detail-share" aria-label="Share this entry">Share</button>
        <button type="button" class="btn btn-danger" id="detail-flag" aria-label="Report this entry">Report</button>
        <button type="button" class="btn" id="detail-close" aria-label="Close dialog">Close [Esc]</button>
      </div>
    `;

    const body = App.showModal(` ${App.esc(entry.name)} `, html);
    App.state.currentEntry = entry;

    // Copy command
    const copyCmd = () => {
      navigator.clipboard.writeText(cmd).then(() => {
        const el = body.querySelector('#detail-cmd');
        const orig = el.textContent;
        el.textContent = 'Copied!';
        el.setAttribute('aria-label', 'Copied to clipboard');
        setTimeout(() => { el.textContent = orig; el.setAttribute('aria-label', 'Connection command: ' + cmd + '. Press Enter to copy.'); }, 1500);
      });
    };
    body.querySelector('#detail-cmd').addEventListener('click', copyCmd);
    body.querySelector('#detail-cmd').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyCmd(); }
    });

    // Check vote status
    try {
      const { voted } = await App.api(`/votes/${entry.id}/check`);
      if (voted) {
        const btn = body.querySelector('#detail-upvote');
        btn.classList.add('voted');
        btn.textContent = `^Voted (${entry.upvotes || 0})`;
      }
    } catch { /* ignore */ }

    // Upvote
    body.querySelector('#detail-upvote').addEventListener('click', async () => {
      const btn = body.querySelector('#detail-upvote');
      if (btn.classList.contains('voted') || btn.disabled) return;
      btn.disabled = true;
      try {
        const { upvotes } = await App.api(`/votes/${entry.id}`, { method: 'POST' });
        btn.classList.add('voted');
        btn.textContent = `^Voted (${upvotes})`;
        entry.upvotes = upvotes;
        Phonebook.renderList();
      } catch (err) {
        if (err.message === 'Already voted') {
          btn.classList.add('voted');
          btn.textContent = `^Voted (${entry.upvotes || 0})`;
        } else {
          btn.disabled = false;
        }
      }
    });

    // Connect in terminal
    const connectBtn = body.querySelector('#detail-connect');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        TerminalView.connect(entry);
      });
    }

    // Share — use deep link URL
    body.querySelector('#detail-share').addEventListener('click', () => {
      const shareUrl = `https://telix.dev/#entry-${entry.id}`;
      const shareText = `${entry.name} - ${cmd}`;
      // Update browser URL hash
      window.history.replaceState(null, '', `#entry-${entry.id}`);
      if (navigator.share) {
        navigator.share({ title: entry.name, text: shareText, url: shareUrl }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
          const btn = body.querySelector('#detail-share');
          btn.textContent = 'Link copied!';
          setTimeout(() => { btn.textContent = 'Share'; }, 1500);
        });
      }
    });

    // Flag
    body.querySelector('#detail-flag').addEventListener('click', async () => {
      const flagBtn = body.querySelector('#detail-flag');
      try {
        await App.api(`/entries/${entry.id}/flag`, { method: 'POST' });
        flagBtn.textContent = 'Reported';
        flagBtn.style.cursor = 'default';
      } catch { /* ignore */ }
    });

    // Close
    body.querySelector('#detail-close').addEventListener('click', () => App.closeModal());
  },
};
