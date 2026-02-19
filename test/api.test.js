const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Set env before any requires — use in-memory database for isolation
process.env.PORT = '3099';
process.env.TURNSTILE_SECRET_KEY = '';
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

// Helpers
function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, 'http://127.0.0.1:3099');
    const opts = {
      hostname: '127.0.0.1',
      port: 3099,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let server, db;
// Track IDs inserted during setup
let bbsId, mudId, apiId;

before(async () => {
  const express = require('express');
  db = require('../backend/db');
  const app = express();

  app.set('trust proxy', true);
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.use('/api/entries', require('../backend/routes/entries'));
  app.use('/api/votes', require('../backend/routes/votes'));
  app.use('/api/check', require('../backend/routes/check'));

  await new Promise((resolve) => {
    server = app.listen(3099, resolve);
  });

  // Insert test entries and remember their IDs
  const ins = db.prepare(`INSERT OR IGNORE INTO entries (name, host, port, protocol, description, category, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  let r = ins.run('Test BBS', 'test.bbs.example', 23, 'telnet', 'A test BBS entry', 'bbs', '["test"]');
  bbsId = r.lastInsertRowid || db.prepare("SELECT id FROM entries WHERE host='test.bbs.example'").get()?.id;

  r = ins.run('Test MUD', 'test.mud.example', 4000, 'telnet', 'A test MUD entry', 'mud', '["test","game"]');
  mudId = r.lastInsertRowid || db.prepare("SELECT id FROM entries WHERE host='test.mud.example'").get()?.id;

  r = ins.run('Test API', 'test.api.example', 443, 'https', 'A test API entry', 'api', '["test","curl"]');
  apiId = r.lastInsertRowid || db.prepare("SELECT id FROM entries WHERE host='test.api.example'").get()?.id;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) db.close();
});

// -- Category Stats Tests --

describe('GET /api/entries/stats', () => {
  it('returns category counts', async () => {
    const res = await request('GET', '/api/entries/stats');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.categories));
    assert.ok(res.body.total >= 3);
    assert.ok(res.body.categories.length >= 1);
    assert.ok(res.body.categories[0].category);
    assert.ok(typeof res.body.categories[0].count === 'number');
    assert.ok(typeof res.body.online === 'number');
  });
});

// -- Random Entry Tests --

describe('GET /api/entries/random', () => {
  before(() => {
    // Ensure at least one online entry exists
    db.prepare(`UPDATE entries SET status = 'online' WHERE host = 'test.bbs.example'`).run();
  });

  it('returns a random entry', async () => {
    const res = await request('GET', '/api/entries/random');
    assert.equal(res.status, 200);
    assert.ok(res.body.id);
    assert.ok(res.body.name);
    assert.equal(res.body.status, 'online');
  });
});

// -- Entries API Tests --

describe('GET /api/entries', () => {
  it('returns entries list with pagination', async () => {
    const res = await request('GET', '/api/entries');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.entries));
    assert.ok(res.body.total >= 3);
    assert.equal(res.body.page, 1);
    assert.ok(res.body.pages >= 1);
  });

  it('filters by category', async () => {
    const res = await request('GET', '/api/entries?category=bbs');
    assert.equal(res.status, 200);
    assert.ok(res.body.entries.length >= 1);
    assert.ok(res.body.entries.every((e) => e.category === 'bbs'));
  });

  it('filters by protocol', async () => {
    const res = await request('GET', '/api/entries?protocol=https');
    assert.equal(res.status, 200);
    assert.ok(res.body.entries.length >= 1);
    assert.ok(res.body.entries.every((e) => e.protocol === 'https'));
  });

  it('searches by name', async () => {
    const res = await request('GET', '/api/entries?search=Test%20BBS');
    assert.equal(res.status, 200);
    assert.ok(res.body.entries.length >= 1);
    assert.ok(res.body.entries.some((e) => e.name === 'Test BBS'));
  });

  it('sorts by upvotes', async () => {
    const res = await request('GET', '/api/entries?sort=upvotes');
    assert.equal(res.status, 200);
    for (let i = 1; i < res.body.entries.length; i++) {
      assert.ok(res.body.entries[i - 1].upvotes >= res.body.entries[i].upvotes);
    }
  });

  it('sorts by name', async () => {
    const res = await request('GET', '/api/entries?sort=name');
    assert.equal(res.status, 200);
    for (let i = 1; i < res.body.entries.length; i++) {
      assert.ok(res.body.entries[i - 1].name <= res.body.entries[i].name);
    }
  });

  it('ignores invalid category filter', async () => {
    const res = await request('GET', '/api/entries?category=INVALID');
    assert.equal(res.status, 200);
    assert.ok(res.body.total >= 3);
  });
});

describe('GET /api/entries/:id', () => {
  it('returns a single entry', async () => {
    const res = await request('GET', `/api/entries/${mudId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Test MUD');
    assert.ok(res.body.host);
    assert.ok(res.body.port);
  });

  it('returns 404 for nonexistent entry', async () => {
    const res = await request('GET', '/api/entries/99999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Entry not found');
  });
});

describe('POST /api/entries/:id/flag', () => {
  it('flags an entry', async () => {
    const res = await request('POST', `/api/entries/${apiId}/flag`);
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('returns 404 for nonexistent entry', async () => {
    const res = await request('POST', '/api/entries/99999/flag');
    assert.equal(res.status, 404);
  });
});

// -- Votes API Tests --

describe('POST /api/votes/:entryId', () => {
  let voteEntryId;
  before(() => {
    // Create a fresh entry for vote testing to avoid prior state
    const r = db.prepare(`INSERT INTO entries (name, host, port, protocol, description, category)
      VALUES (?, ?, ?, 'telnet', 'Vote test entry', 'other')`)
      .run('Vote Test', `votetest-${Date.now()}.example`, 9999);
    voteEntryId = r.lastInsertRowid;
  });

  it('creates a vote', async () => {
    const res = await request('POST', `/api/votes/${voteEntryId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.upvotes >= 1);
  });

  it('rejects duplicate vote from same IP', async () => {
    const res = await request('POST', `/api/votes/${voteEntryId}`);
    assert.equal(res.status, 409);
    assert.match(res.body.error, /already voted/i);
  });

  it('returns 404 for nonexistent entry', async () => {
    const res = await request('POST', '/api/votes/99999');
    assert.equal(res.status, 404);
  });
});

describe('GET /api/votes/:entryId/check', () => {
  it('returns voted=false for un-voted entry', async () => {
    // Create a fresh entry to ensure no prior votes
    const r = db.prepare(`INSERT INTO entries (name, host, port, protocol, description, category)
      VALUES (?, ?, ?, 'telnet', 'Check test entry', 'other')`)
      .run('Check Test', `checktest-${Date.now()}.example`, 9998);
    const res = await request('GET', `/api/votes/${r.lastInsertRowid}/check`);
    assert.equal(res.status, 200);
    assert.equal(res.body.voted, false);
  });
});

// -- Status Check Tests --

describe('POST /api/check/:id', () => {
  it('checks an entry status', async () => {
    const res = await request('POST', `/api/check/${bbsId}`);
    assert.equal(res.status, 200);
    assert.ok(['online', 'offline'].includes(res.body.status));
    assert.ok(res.body.last_checked);
  });

  it('returns 404 for nonexistent entry', async () => {
    const res = await request('POST', '/api/check/99999');
    assert.equal(res.status, 404);
  });
});

// -- Static File Tests --

describe('Static files', () => {
  it('serves index.html at root', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
  });
});

// -- Database Tests --

describe('Database', () => {
  it('has WAL mode enabled', () => {
    const result = db.pragma('journal_mode');
    const mode = result[0]?.journal_mode || result;
    // In-memory DBs report 'memory'; file-based DBs should use 'wal'
    assert.ok(mode === 'wal' || mode === 'memory');
  });

  it('has foreign keys enabled', () => {
    const fk = db.pragma('foreign_keys');
    const val = fk[0]?.foreign_keys ?? fk;
    assert.equal(val, 1);
  });

  it('has entries table with correct columns', () => {
    const cols = db.prepare("PRAGMA table_info(entries)").all().map((c) => c.name);
    assert.ok(cols.includes('id'));
    assert.ok(cols.includes('name'));
    assert.ok(cols.includes('host'));
    assert.ok(cols.includes('port'));
    assert.ok(cols.includes('protocol'));
    assert.ok(cols.includes('status'));
    assert.ok(cols.includes('upvotes'));
    assert.ok(cols.includes('flagged'));
    assert.ok(cols.includes('submitted_by_ip'));
  });

  it('has votes table', () => {
    const cols = db.prepare("PRAGMA table_info(votes)").all().map((c) => c.name);
    assert.ok(cols.includes('entry_id'));
    assert.ok(cols.includes('voter_ip'));
  });

  it('has required indexes', () => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map((i) => i.name);
    assert.ok(indexes.includes('idx_entries_category'));
    assert.ok(indexes.includes('idx_entries_status'));
    assert.ok(indexes.includes('idx_entries_upvotes'));
  });
});

// -- Status Checker Unit Tests --

describe('Status Checker', () => {
  it('checkHost returns online for reachable hosts', async () => {
    const { checkHost } = require('../backend/jobs/status-checker');
    const result = await checkHost('127.0.0.1', 3099, 2000);
    assert.equal(result.status, 'online');
    assert.ok(typeof result.response_time === 'number');
  });

  it('checkHost returns offline for unreachable hosts', async () => {
    const { checkHost } = require('../backend/jobs/status-checker');
    const result = await checkHost('192.0.2.1', 1, 1000);
    assert.equal(result.status, 'offline');
    assert.equal(result.response_time, null);
  });
});
