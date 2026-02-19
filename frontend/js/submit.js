/* -- Telix.dev -Submit Entry -- */
const Submit = {
  show() {
    const catOpts = Object.entries(App.CATEGORIES)
      .filter(([v]) => v)
      .map(([v, l]) => `<option value="${v}">${l}</option>`)
      .join('');

    const protoOpts = Object.entries(App.PROTOCOLS)
      .filter(([v]) => v)
      .map(([v, l]) => `<option value="${v}">${l}</option>`)
      .join('');

    const turnstileSiteKey = document.querySelector('meta[name="turnstile-site-key"]')?.content;

    const html = `
      <form id="submit-form" aria-label="Submit a new phonebook entry">
        <div class="form-group">
          <label for="field-name">Name *</label>
          <input type="text" id="field-name" name="name" maxlength="100" required placeholder="e.g. Synchronet BBS Demo" aria-required="true">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="field-host">Host *</label>
            <input type="text" id="field-host" name="host" maxlength="253" required placeholder="e.g. demo.synchro.net" aria-required="true">
          </div>
          <div class="form-group" style="max-width:10ch">
            <label for="field-port">Port *</label>
            <input type="number" id="field-port" name="port" min="1" max="65535" required placeholder="23" aria-required="true">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="field-protocol">Protocol</label>
            <select id="field-protocol" name="protocol">${protoOpts}</select>
          </div>
          <div class="form-group">
            <label for="field-category">Category</label>
            <select id="field-category" name="category">${catOpts}</select>
          </div>
        </div>
        <div class="form-group">
          <label for="field-description">Description * <span class="text-dim">(280 chars max)</span></label>
          <textarea id="field-description" name="description" maxlength="280" rows="3" required placeholder="What is this? Why should someone connect?" aria-required="true"></textarea>
        </div>
        <div class="form-group">
          <label for="field-tags">Tags <span class="text-dim">(comma separated)</span></label>
          <input type="text" id="field-tags" name="tags" placeholder="e.g. retro, games, linux">
        </div>
        <div class="form-group">
          <label for="field-url">URL <span class="text-dim">(optional website)</span></label>
          <input type="url" id="field-url" name="url" placeholder="https://...">
        </div>
        <div class="form-group">
          <label for="field-submitted-by">Your Name <span class="text-dim">(optional)</span></label>
          <input type="text" id="field-submitted-by" name="submitted_by" maxlength="50" placeholder="anonymous">
        </div>
        ${turnstileSiteKey ? `<div class="form-group" id="turnstile-container">
          <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark"></div>
        </div>` : ''}
        <div id="submit-error" class="form-error" role="alert" style="display:none"></div>
        <div class="form-actions">
          <button type="submit" class="btn btn-accent">Submit Entry</button>
          <button type="button" class="btn" id="submit-cancel">Cancel [Esc]</button>
        </div>
      </form>
    `;

    const body = App.showModal(' Submit New Entry \u2500 F2 ', html);

    // Load Turnstile widget script if needed
    if (turnstileSiteKey && !document.querySelector('script[src*="turnstile"]')) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      document.head.appendChild(s);
    }

    // Cancel
    body.querySelector('#submit-cancel').addEventListener('click', () => App.closeModal());

    // Submit
    body.querySelector('#submit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errEl = body.querySelector('#submit-error');
      errEl.style.display = 'none';

      const data = {
        name: form.name.value.trim(),
        host: form.host.value.trim(),
        port: parseInt(form.port.value),
        protocol: form.protocol.value,
        category: form.category.value,
        description: form.description.value.trim(),
        url: form.url.value.trim() || undefined,
        submitted_by: form.submitted_by.value.trim() || 'anonymous',
      };

      // Parse tags
      const tagsRaw = form.tags.value.trim();
      if (tagsRaw) {
        data.tags = JSON.stringify(tagsRaw.split(',').map(t => t.trim()).filter(Boolean));
      }

      // Turnstile token
      const turnstileInput = form.querySelector('[name="cf-turnstile-response"]');
      if (turnstileInput) {
        data['cf-turnstile-response'] = turnstileInput.value;
      }

      // Client-side validation
      if (!data.name || !data.host || !data.port || !data.description) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.style.display = 'block';
        return;
      }

      if (data.port < 1 || data.port > 65535 || isNaN(data.port)) {
        errEl.textContent = 'Port must be between 1 and 65535.';
        errEl.style.display = 'block';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        await App.api('/entries', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        App.closeModal();
        App.state.page = 1;
        App.state.filters.sort = 'newest';
        const sortEl = document.getElementById('filter-sort');
        if (sortEl) sortEl.value = 'newest';
        Phonebook.load();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        submitBtn.textContent = 'Submit Entry';
        submitBtn.disabled = false;
      }
    });
  },
};
