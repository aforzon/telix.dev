const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Helpers
function request(method, urlPath) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3098,
      path: urlPath,
      method,
      headers: { 'Accept': 'text/html' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

let server;

before(async () => {
  process.env.PORT = '3098';
  process.env.TURNSTILE_SECRET_KEY = '';

  const express = require('express');
  const db = require('../backend/db');
  const app = express();

  app.set('trust proxy', true);
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.use('/api/entries', require('../backend/routes/entries'));
  app.use('/api/votes', require('../backend/routes/votes'));
  app.use('/api/check', require('../backend/routes/check'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });

  await new Promise((resolve) => {
    server = app.listen(3098, resolve);
  });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

// ── SEO Tests ──

describe('SEO', () => {
  let html;
  before(async () => {
    const res = await request('GET', '/');
    html = res.body;
  });

  it('has a <title> tag', () => {
    assert.match(html, /<title>[^<]+<\/title>/);
  });

  it('title contains site name', () => {
    assert.match(html, /<title>.*Telix\.dev.*<\/title>/);
  });

  it('has meta description', () => {
    assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/);
  });

  it('meta description is between 50-160 chars', () => {
    const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    assert.ok(match, 'meta description exists');
    assert.ok(match[1].length >= 50, `description too short: ${match[1].length} chars`);
    assert.ok(match[1].length <= 160, `description too long: ${match[1].length} chars`);
  });

  it('has canonical URL', () => {
    assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/telix\.dev"/);
  });

  it('has Open Graph title', () => {
    assert.match(html, /<meta\s+property="og:title"\s+content="[^"]+"/);
  });

  it('has Open Graph description', () => {
    assert.match(html, /<meta\s+property="og:description"\s+content="[^"]+"/);
  });

  it('has Open Graph type', () => {
    assert.match(html, /<meta\s+property="og:type"\s+content="website"/);
  });

  it('has Open Graph URL', () => {
    assert.match(html, /<meta\s+property="og:url"\s+content="https:\/\/telix\.dev"/);
  });

  it('has Open Graph site_name', () => {
    assert.match(html, /<meta\s+property="og:site_name"\s+content="[^"]+"/);
  });

  it('has Open Graph image', () => {
    assert.match(html, /<meta\s+property="og:image"\s+content="[^"]+"/);
  });

  it('has Twitter card', () => {
    assert.match(html, /<meta\s+name="twitter:card"\s+content="[^"]+"/);
  });

  it('has Twitter title', () => {
    assert.match(html, /<meta\s+name="twitter:title"\s+content="[^"]+"/);
  });

  it('has Twitter description', () => {
    assert.match(html, /<meta\s+name="twitter:description"\s+content="[^"]+"/);
  });

  it('has Twitter image', () => {
    assert.match(html, /<meta\s+name="twitter:image"\s+content="[^"]+"/);
  });

  it('has robots meta tag', () => {
    assert.match(html, /<meta\s+name="robots"\s+content="index,?\s*follow"/);
  });

  it('has theme-color', () => {
    assert.match(html, /<meta\s+name="theme-color"\s+content="[^"]+"/);
  });

  it('has favicon', () => {
    assert.match(html, /<link\s+rel="icon"/);
  });

  it('has apple-touch-icon', () => {
    assert.match(html, /<link\s+rel="apple-touch-icon"/);
  });

  it('has structured data (JSON-LD)', () => {
    assert.match(html, /<script\s+type="application\/ld\+json">/);
    assert.match(html, /"@type"\s*:\s*"WebSite"/);
  });

  it('has Google Analytics', () => {
    assert.match(html, /googletagmanager\.com\/gtag/);
    assert.match(html, /G-705ZS1PML4/);
  });

  it('has keywords meta tag', () => {
    assert.match(html, /<meta\s+name="keywords"\s+content="[^"]+"/);
  });

  it('robots.txt exists and is correct', async () => {
    const res = await request('GET', '/robots.txt');
    assert.equal(res.status, 200);
    assert.match(res.body, /User-agent:\s*\*/);
    assert.match(res.body, /Sitemap:\s*https:\/\/telix\.dev\/sitemap\.xml/);
  });

  it('sitemap.xml exists and is valid', async () => {
    const res = await request('GET', '/sitemap.xml');
    assert.equal(res.status, 200);
    assert.match(res.body, /<urlset/);
    assert.match(res.body, /<loc>https:\/\/telix\.dev\/<\/loc>/);
  });

  it('favicon.ico exists', async () => {
    const res = await request('GET', '/favicon.ico');
    assert.equal(res.status, 200);
  });

  it('apple-touch-icon.png exists', async () => {
    const res = await request('GET', '/apple-touch-icon.png');
    assert.equal(res.status, 200);
  });
});

// ── W3C HTML Validity Tests ──

describe('W3C HTML Validity', () => {
  let html;
  before(async () => {
    const res = await request('GET', '/');
    html = res.body;
  });

  it('has DOCTYPE declaration', () => {
    assert.match(html, /^<!DOCTYPE html>/i);
  });

  it('has html lang attribute', () => {
    assert.match(html, /<html\s+lang="[a-z]{2}"/);
  });

  it('has charset meta tag', () => {
    assert.match(html, /<meta\s+charset="UTF-8"/i);
  });

  it('has viewport meta tag', () => {
    assert.match(html, /<meta\s+name="viewport"/);
  });

  it('has proper head and body structure', () => {
    assert.match(html, /<head>[\s\S]*<\/head>/);
    assert.match(html, /<body>[\s\S]*<\/body>/);
  });

  it('title is inside head', () => {
    const headMatch = html.match(/<head>([\s\S]*)<\/head>/);
    assert.ok(headMatch);
    assert.match(headMatch[1], /<title>/);
  });

  it('all script tags have src or inline content', () => {
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    for (const script of scripts) {
      const hasSrc = /src=/.test(script);
      const hasContent = /<script[^>]*>[^<]+<\/script>/.test(script);
      const hasType = /type="application\/ld\+json"/.test(script);
      assert.ok(hasSrc || hasContent || hasType, `Script tag should have src or content: ${script.slice(0, 80)}`);
    }
  });

  it('no duplicate IDs in static HTML', () => {
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `Duplicate IDs found: ${dupes.join(', ')}`);
  });

  it('all link tags have rel attribute', () => {
    const links = html.match(/<link\s[^>]*>/g) || [];
    for (const link of links) {
      assert.match(link, /rel="/, `Link tag missing rel: ${link}`);
    }
  });

  it('images have alt attributes (if any)', () => {
    const imgs = html.match(/<img\s[^>]*>/g) || [];
    for (const img of imgs) {
      assert.match(img, /alt="/, `Image missing alt: ${img}`);
    }
  });
});

// ── WCAG 2.0 Accessibility Tests ──

describe('WCAG 2.0 Accessibility', () => {
  let html;
  before(async () => {
    const res = await request('GET', '/');
    html = res.body;
  });

  // 1.1.1 Non-text Content
  it('1.1.1 — images have text alternatives', () => {
    const imgs = html.match(/<img\s[^>]*>/g) || [];
    for (const img of imgs) {
      assert.match(img, /alt=/, `Image missing alt text: ${img}`);
    }
  });

  // 1.3.1 Info and Relationships
  it('1.3.1 — uses semantic landmarks', () => {
    assert.match(html, /role="banner"|<header/);
    assert.match(html, /role="contentinfo"|<footer/);
    assert.match(html, /<main|role="main"/);
  });

  it('1.3.1 — form inputs have associated labels', () => {
    // Check submit.js form labels have for attributes
    const submitJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'submit.js'), 'utf8');
    assert.match(submitJs, /label\s+for="/);
  });

  // 2.1.1 Keyboard
  it('2.1.1 — phonebook list is keyboard focusable', () => {
    assert.match(html, /id="phonebook-list"[^>]*tabindex="0"/);
  });

  // 2.4.1 Bypass Blocks
  it('2.4.1 — has skip navigation link', () => {
    assert.match(html, /class="skip-link"/);
    assert.match(html, /Skip to phonebook/);
  });

  // 2.4.2 Page Titled
  it('2.4.2 — page has a title', () => {
    assert.match(html, /<title>[^<]+<\/title>/);
  });

  // 2.4.3 Focus Order
  it('2.4.3 — modals trap focus', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'app.js'), 'utf8');
    assert.match(appJs, /aria-modal="true"/);
    assert.match(appJs, /Tab/); // focus trap logic
  });

  it('2.4.3 — modals restore focus on close', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'app.js'), 'utf8');
    assert.match(appJs, /_previousFocus/);
  });

  // 2.4.4 Link Purpose
  it('2.4.4 — buttons have descriptive labels', () => {
    const detailJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'detail.js'), 'utf8');
    assert.match(detailJs, /aria-label="Upvote this entry"/);
    assert.match(detailJs, /aria-label="Close dialog"/);
  });

  // 2.4.7 Focus Visible
  it('2.4.7 — CSS provides visible focus indicators', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'css', 'terminal.css'), 'utf8');
    assert.match(css, /focus-visible/);
    assert.match(css, /outline.*solid.*var\(--accent\)/);
    // Ensure no blanket outline:none without replacement
    const outlineNone = (css.match(/outline:\s*none/g) || []).length;
    assert.equal(outlineNone, 0, 'Should not have outline:none (removes focus indicators)');
  });

  // 2.3.1 Three Flashes or Below Threshold
  it('2.3.1 — respects prefers-reduced-motion', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'css', 'terminal.css'), 'utf8');
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
  });

  // 3.1.1 Language of Page
  it('3.1.1 — html element has lang attribute', () => {
    assert.match(html, /<html\s+lang="en"/);
  });

  // 4.1.1 Parsing
  it('4.1.1 — no duplicate IDs in HTML', () => {
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `Duplicate IDs: ${dupes.join(', ')}`);
  });

  // 4.1.2 Name, Role, Value
  it('4.1.2 — phonebook list has listbox role', () => {
    assert.match(html, /role="listbox"/);
  });

  it('4.1.2 — entry rows have option role with aria-selected', () => {
    const phonebookJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'phonebook.js'), 'utf8');
    assert.match(phonebookJs, /role="option"/);
    assert.match(phonebookJs, /aria-selected="/);
  });

  it('4.1.2 — modals have dialog role', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'app.js'), 'utf8');
    assert.match(appJs, /role="dialog"/);
    assert.match(appJs, /aria-labelledby="/);
  });

  it('4.1.2 — search inputs have aria-label', () => {
    const phonebookJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'phonebook.js'), 'utf8');
    assert.match(phonebookJs, /aria-label="Search entries"/);
    assert.match(phonebookJs, /aria-label="Filter by category"/);
  });

  it('4.1.2 — form fields have aria-required', () => {
    const submitJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'submit.js'), 'utf8');
    assert.match(submitJs, /aria-required="true"/);
  });

  it('4.1.2 — error messages have role=alert', () => {
    const submitJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'submit.js'), 'utf8');
    assert.match(submitJs, /role="alert"/);
  });

  it('4.1.2 — live region for screen reader announcements', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'app.js'), 'utf8');
    assert.match(appJs, /aria-live/);
    assert.match(appJs, /announce/);
  });

  // Screen reader only text
  it('has screen-reader-only CSS class', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'css', 'terminal.css'), 'utf8');
    assert.match(css, /\.sr-only/);
    assert.match(css, /clip:\s*rect\(0/);
  });
});

// ── Security Headers Tests (nginx-level, tested against config file) ──

describe('Security Headers (nginx config)', () => {
  let secHeaders;
  before(() => {
    secHeaders = fs.readFileSync('/etc/nginx/snippets/security-headers-telix.conf', 'utf8');
  });

  it('has X-Content-Type-Options nosniff', () => {
    assert.match(secHeaders, /X-Content-Type-Options\s+nosniff/);
  });

  it('has X-Frame-Options', () => {
    assert.match(secHeaders, /X-Frame-Options\s+(SAMEORIGIN|DENY)/);
  });

  it('has Referrer-Policy', () => {
    assert.match(secHeaders, /Referrer-Policy/);
  });

  it('has Permissions-Policy', () => {
    assert.match(secHeaders, /Permissions-Policy/);
    assert.match(secHeaders, /geolocation=\(\)/);
    assert.match(secHeaders, /camera=\(\)/);
  });

  it('has Strict-Transport-Security (HSTS)', () => {
    assert.match(secHeaders, /Strict-Transport-Security/);
    assert.match(secHeaders, /max-age=31536000/);
    assert.match(secHeaders, /includeSubDomains/);
  });

  it('has Content-Security-Policy', () => {
    assert.match(secHeaders, /Content-Security-Policy/);
    assert.match(secHeaders, /default-src\s+'self'/);
  });

  it('CSP allows Google Analytics', () => {
    assert.match(secHeaders, /googletagmanager\.com/);
    assert.match(secHeaders, /google-analytics\.com/);
  });

  it('CSP allows Cloudflare Turnstile', () => {
    assert.match(secHeaders, /challenges\.cloudflare\.com/);
  });

  it('CSP allows inline styles (needed for terminal rendering)', () => {
    assert.match(secHeaders, /style-src[^;]*'unsafe-inline'/);
  });
});

describe('Security (nginx site config)', () => {
  let nginxConf;
  before(() => {
    nginxConf = fs.readFileSync('/var/www/telix.dev/nginx/telix.dev', 'utf8');
  });

  it('blocks .env files', () => {
    assert.match(nginxConf, /\.env.*deny all/);
  });

  it('blocks node_modules', () => {
    assert.match(nginxConf, /node_modules.*deny all/);
  });

  it('blocks backend directory', () => {
    assert.match(nginxConf, /backend.*deny all/);
  });

  it('blocks data directory', () => {
    assert.match(nginxConf, /data.*deny all/);
  });

  it('blocks package.json', () => {
    assert.match(nginxConf, /package.*json.*deny all/);
  });

  it('redirects HTTP to HTTPS', () => {
    assert.match(nginxConf, /listen\s+80/);
    assert.match(nginxConf, /return\s+301\s+https/);
  });

  it('redirects www to non-www', () => {
    assert.match(nginxConf, /server_name\s+www\.telix\.dev/);
    assert.match(nginxConf, /return\s+301\s+https:\/\/telix\.dev/);
  });

  it('has rate limiting on API', () => {
    assert.match(nginxConf, /limit_req\s+zone=telix_api/);
  });

  it('includes Cloudflare real IP config', () => {
    assert.match(nginxConf, /include\s+snippets\/cloudflare\.conf/);
  });

  it('has HTTP/2 enabled', () => {
    assert.match(nginxConf, /http2\s+on/);
  });
});

// ── Functionality Smoke Tests ──

describe('Functionality', () => {
  it('homepage returns 200', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
  });

  it('API returns entries', async () => {
    const res = await request('GET', '/api/entries');
    const data = JSON.parse(res.body);
    assert.ok(data.entries.length > 0);
    assert.ok(data.total > 0);
  });

  it('API supports category filter', async () => {
    const res = await request('GET', '/api/entries?category=mud');
    const data = JSON.parse(res.body);
    assert.ok(data.entries.every(e => e.category === 'mud'));
  });

  it('API supports search', async () => {
    const res = await request('GET', '/api/entries?search=Aardwolf');
    const data = JSON.parse(res.body);
    assert.ok(data.entries.some(e => e.name.includes('Aardwolf')));
  });

  it('API supports sorting', async () => {
    const res = await request('GET', '/api/entries?sort=name');
    const data = JSON.parse(res.body);
    for (let i = 1; i < data.entries.length; i++) {
      assert.ok(data.entries[i - 1].name <= data.entries[i].name);
    }
  });

  it('static CSS loads', async () => {
    const res = await request('GET', '/css/terminal.css');
    assert.equal(res.status, 200);
  });

  it('static JS loads', async () => {
    const res = await request('GET', '/js/app.js');
    assert.equal(res.status, 200);
  });

  it('font file loads', async () => {
    const res = await request('GET', '/fonts/dos-vga.woff2');
    assert.equal(res.status, 200);
  });

  it('SPA fallback works for unknown routes', async () => {
    const res = await request('GET', '/some/random/path');
    assert.equal(res.status, 200);
    assert.match(res.body, /<title>/);
  });

  it('API returns 404 for nonexistent entry', async () => {
    const res = await request('GET', '/api/entries/99999');
    assert.equal(res.status, 404);
  });
});
