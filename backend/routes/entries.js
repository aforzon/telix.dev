const express = require('express');
const db = require('../db');
const router = express.Router();

const VALID_PROTOCOLS = ['telnet', 'ssh', 'http', 'https', 'raw', 'gopher', 'gemini', 'finger'];
const VALID_CATEGORIES = ['bbs', 'mud', 'game', 'ascii-art', 'network-tool', 'sandbox', 'irc', 'chat', 'api', 'gopher', 'gemini', 'finger', 'radio', 'other'];
const VALID_SORT = ['newest', 'upvotes', 'name', 'recently_checked'];
const PAGE_SIZE = 50;

// GET /api/entries/random — random online entry
router.get('/random', (req, res) => {
  const entry = db.prepare(
    `SELECT id, name, host, port, protocol, description, category, tags, upvotes, last_checked, status, response_time, url
     FROM entries WHERE flagged < 5 AND status = 'online' ORDER BY RANDOM() LIMIT 1`
  ).get();
  if (!entry) return res.status(404).json({ error: 'No entries found' });
  res.json(entry);
});

// GET /api/entries/stats — category counts for landing page
router.get('/stats', (req, res) => {
  const rows = db.prepare(
    `SELECT category, COUNT(*) as count FROM entries WHERE flagged < 5 AND status != 'offline' GROUP BY category ORDER BY count DESC`
  ).all();
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const onlineRow = db.prepare(
    `SELECT COUNT(*) as count FROM entries WHERE flagged < 5 AND status = 'online'`
  ).get();
  res.json({ categories: rows, total, online: onlineRow.count });
});

// GET /api/entries — list with filter/sort/search/pagination
router.get('/', (req, res) => {
  const { category, protocol, status, sort, search, page } = req.query;

  let where = ['flagged < 5'];
  const params = {};

  // Hide offline entries unless explicitly requested
  if (status && ['online', 'offline', 'unknown'].includes(status)) {
    where.push('status = @status');
    params.status = status;
  } else {
    where.push("status != 'offline'");
  }

  if (category && VALID_CATEGORIES.includes(category)) {
    where.push('category = @category');
    params.category = category;
  }
  if (protocol && VALID_PROTOCOLS.includes(protocol)) {
    where.push('protocol = @protocol');
    params.protocol = protocol;
  }
  if (search && search.trim()) {
    where.push('(name LIKE @search OR description LIKE @search OR tags LIKE @search OR host LIKE @search)');
    params.search = `%${search.trim()}%`;
  }

  let orderBy = 'submitted_at DESC';
  if (sort === 'upvotes') orderBy = 'upvotes DESC, submitted_at DESC';
  else if (sort === 'name') orderBy = 'name ASC';
  else if (sort === 'recently_checked') orderBy = 'last_checked DESC NULLS LAST, submitted_at DESC';

  const offset = Math.max(0, ((parseInt(page) || 1) - 1)) * PAGE_SIZE;
  params.limit = PAGE_SIZE;
  params.offset = offset;

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM entries ${whereClause}`).get(params);
  const entries = db.prepare(
    `SELECT id, name, host, port, protocol, description, category, tags, submitted_by, submitted_at, upvotes, last_checked, status, response_time, url
     FROM entries ${whereClause} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`
  ).all(params);

  res.json({
    entries,
    total: countRow.total,
    page: Math.floor(offset / PAGE_SIZE) + 1,
    pages: Math.ceil(countRow.total / PAGE_SIZE),
  });
});

// GET /api/entries/:id — single entry
router.get('/:id', (req, res) => {
  const entry = db.prepare(
    'SELECT * FROM entries WHERE id = ? AND flagged = 0'
  ).get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

// POST /api/entries — submit a new entry
const verifyTurnstile = require('../middleware/turnstile');
const submitTracker = new Map(); // ip -> timestamp of last submission

router.post('/', verifyTurnstile, (req, res) => {
  // Rate limit: 1 submission per IP per 5 minutes
  const now = Date.now();
  const lastSubmit = submitTracker.get(req.ip);
  if (lastSubmit && now - lastSubmit < 300_000) {
    return res.status(429).json({ error: 'Please wait a few minutes before submitting again.' });
  }

  const { name, host, port, protocol, description, category, tags, url } = req.body;

  // Validation
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!host || !host.trim()) return res.status(400).json({ error: 'Host is required' });
  if (!port || isNaN(port) || port < 1 || port > 65535) return res.status(400).json({ error: 'Valid port is required (1-65535)' });
  if (!protocol || !VALID_PROTOCOLS.includes(protocol)) return res.status(400).json({ error: 'Valid protocol is required' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required' });
  if (description.trim().length > 280) return res.status(400).json({ error: 'Description must be 280 characters or less' });
  if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Valid category is required' });
  if (name.trim().length > 64) return res.status(400).json({ error: 'Name must be 64 characters or less' });
  if (host.trim().length > 128) return res.status(400).json({ error: 'Host must be 128 characters or less' });

  // Check for duplicate
  const existing = db.prepare('SELECT id FROM entries WHERE host = ? AND port = ?').get(host.trim(), parseInt(port));
  if (existing) return res.status(409).json({ error: 'An entry for this host:port already exists' });

  // Parse tags
  let tagArr = [];
  if (tags && typeof tags === 'string') {
    tagArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t && t.length <= 24).slice(0, 5);
  }

  const result = db.prepare(
    `INSERT INTO entries (name, host, port, protocol, description, category, tags, url, submitted_by, submitted_by_ip, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'community', ?, 'unknown')`
  ).run(
    name.trim(), host.trim(), parseInt(port), protocol,
    description.trim(), category, JSON.stringify(tagArr),
    url ? url.trim() : null, req.ip
  );

  submitTracker.set(req.ip, now);
  res.json({ ok: true, id: result.lastInsertRowid });
});

// POST /api/entries/:id/flag (one flag per IP per entry)
const flagTracker = new Map(); // ip:entryId -> timestamp

router.post('/:id/flag', (req, res) => {
  const entry = db.prepare('SELECT id FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const flagKey = req.ip + ':' + req.params.id;
  if (flagTracker.has(flagKey)) {
    return res.status(409).json({ error: 'Already flagged' });
  }
  flagTracker.set(flagKey, Date.now());

  db.prepare('UPDATE entries SET flagged = flagged + 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
