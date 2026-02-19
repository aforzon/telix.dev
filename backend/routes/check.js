const express = require('express');
const db = require('../db');
const { checkHost } = require('../jobs/status-checker');

const router = express.Router();

const CHECK_COOLDOWN = 60_000; // 60 seconds — skip re-check if recently checked

// POST /api/check/:id — manually check a single entry
router.post('/:id', async (req, res) => {
  const entry = db.prepare('SELECT id, host, port, name, status, response_time, last_checked FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  // Return cached result if checked within cooldown
  if (entry.last_checked) {
    const lastChecked = new Date(entry.last_checked + 'Z').getTime();
    if (Date.now() - lastChecked < CHECK_COOLDOWN) {
      return res.json({
        id: entry.id,
        status: entry.status,
        response_time: entry.response_time,
        last_checked: entry.last_checked,
        cached: true,
      });
    }
  }

  const result = await checkHost(entry.host, entry.port);
  db.prepare(
    "UPDATE entries SET status = ?, response_time = ?, last_checked = datetime('now') WHERE id = ?"
  ).run(result.status, result.response_time, entry.id);

  res.json({ id: entry.id, ...result, last_checked: new Date().toISOString() });
});

module.exports = router;
