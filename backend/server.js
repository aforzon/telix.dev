require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(express.json());

// In-memory rate limiter — tiered by action type
const rateBuckets = new Map();

function createLimiter(name, windowMs, max) {
  return (req, res, next) => {
    const key = name + ':' + req.ip;
    const now = Date.now();
    let record = rateBuckets.get(key);
    if (!record || now - record.start > windowMs) {
      record = { start: now, count: 0 };
      rateBuckets.set(key, record);
    }
    record.count++;
    if (record.count > max) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
    next();
  };
}

// Tiered limits
const readLimit = createLimiter('read', 60_000, 60);    // 60 reads/min (browsing)
const writeLimit = createLimiter('write', 60_000, 10);   // 10 writes/min (votes, flags)
const checkLimit = createLimiter('check', 60_000, 5);    // 5 status checks/min
const globalLimit = createLimiter('global', 60_000, 120); // 120 total req/min per IP

// Clean up rate limit map every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, record] of rateBuckets) {
    if (record.start < cutoff) rateBuckets.delete(key);
  }
}, 300_000);

app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Global rate limit on all API routes
app.use('/api', globalLimit);

// API routes with tiered limits
app.use('/api/entries', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return writeLimit(req, res, next);
  return readLimit(req, res, next);
}, require('./routes/entries'));
app.use('/api/votes', writeLimit, require('./routes/votes'));
app.use('/api/check', checkLimit, require('./routes/check'));

// Admin: view active terminal sessions
app.get('/api/admin/sessions', (req, res) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { getSessions } = require('./routes/terminal');
  res.json({ sessions: getSessions() });
});

// Dynamic sitemap
app.get('/sitemap.xml', (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n    <loc>https://telix.dev/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += '</urlset>';
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// SPA fallback — serve index for root and known SPA routes, 404 for everything else
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Telix.dev listening on port ${PORT}`);

  // Start status checker cron
  const { startCron } = require('./jobs/status-checker');
  startCron(db);
});

// Attach WebSocket terminal proxy
require('./routes/terminal').attach(server);
