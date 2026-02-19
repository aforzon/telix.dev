const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/votes/:entryId — cast a vote
router.post('/:entryId', (req, res) => {
  const entryId = parseInt(req.params.entryId);
  const voterIp = req._realIP || req.ip;

  const entry = db.prepare('SELECT id FROM entries WHERE id = ? AND flagged = 0').get(entryId);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const existing = db.prepare('SELECT id FROM votes WHERE entry_id = ? AND voter_ip = ?').get(entryId, voterIp);
  if (existing) return res.status(409).json({ error: 'Already voted' });

  const vote = db.transaction(() => {
    db.prepare('INSERT INTO votes (entry_id, voter_ip) VALUES (?, ?)').run(entryId, voterIp);
    db.prepare('UPDATE entries SET upvotes = upvotes + 1 WHERE id = ?').run(entryId);
    return db.prepare('SELECT upvotes FROM entries WHERE id = ?').get(entryId);
  })();

  res.json({ ok: true, upvotes: vote.upvotes });
});

// GET /api/votes/:entryId/check — check if current IP has voted
router.get('/:entryId/check', (req, res) => {
  const existing = db.prepare(
    'SELECT id FROM votes WHERE entry_id = ? AND voter_ip = ?'
  ).get(req.params.entryId, req._realIP || req.ip);
  res.json({ voted: !!existing });
});

module.exports = router;
