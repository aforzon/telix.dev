const net = require('net');
const dns = require('dns');
const { resolveAndValidate } = require('../lib/validate-host');

let db;
try { db = require('../db'); } catch { /* loaded standalone */ }

// DNS cache to avoid redundant lookups for same host across entries
const dnsCache = new Map();
const DNS_TIMEOUT = 5000;

function resolveCached(host) {
  if (dnsCache.has(host)) return Promise.resolve(dnsCache.get(host));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`DNS timeout: ${host}`)), DNS_TIMEOUT);
    resolveAndValidate(host).then((ip) => {
      clearTimeout(timer);
      dnsCache.set(host, ip);
      resolve(ip);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function checkHost(host, port, timeout = 8000) {
  return new Promise(async (resolve) => {
    // SSRF protection: validate host before connecting
    let resolvedIP;
    try {
      resolvedIP = await resolveCached(host);
    } catch {
      return resolve({ status: 'offline', response_time: null });
    }

    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve({ status: 'online', response_time: ms });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'offline', response_time: null });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ status: 'offline', response_time: null });
    });

    socket.connect(port, resolvedIP);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkBatch(entries, concurrency = 10) {
  const results = [];
  const total = entries.length;
  for (let i = 0; i < total; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const checks = batch.map(async (entry) => {
      const result = await checkHost(entry.host, entry.port);
      return { id: entry.id, name: entry.name, ...result };
    });
    results.push(...(await Promise.all(checks)));
    // Progress log every 100 entries
    if ((i + concurrency) % 100 < concurrency) {
      const done = Math.min(i + concurrency, total);
      const onlineSoFar = results.filter(r => r.status === 'online').length;
      console.log(`  progress: ${done}/${total} checked (${onlineSoFar} online)`);
    }
    // Delay between batches to avoid hammering DNS/network
    if (i + concurrency < total) {
      await sleep(200);
    }
  }
  return results;
}

async function runChecks(database) {
  const d = database || db;
  // Clear DNS cache at start of each run
  dnsCache.clear();

  const entries = d.prepare('SELECT id, name, host, port, status AS prev_status, flagged FROM entries WHERE flagged < 10').all();
  console.log(`Checking ${entries.length} entries...`);

  const results = await checkBatch(entries);
  const update = d.prepare(
    'UPDATE entries SET status = ?, response_time = ?, last_checked = datetime(\'now\') WHERE id = ?'
  );
  const incFlag = d.prepare('UPDATE entries SET flagged = flagged + 1 WHERE id = ?');

  // Build a lookup map instead of using .find() in a loop
  const entryMap = new Map(entries.map(e => [e.id, e]));

  const tx = d.transaction(() => {
    for (const r of results) {
      update.run(r.status, r.response_time, r.id);

      // Auto-flag entries that are offline: increment flagged count each check
      // After 5 consecutive offline checks, entry gets hidden (flagged >= 5)
      if (r.status === 'offline') {
        const entry = entryMap.get(r.id);
        if (entry && entry.prev_status === 'offline') {
          incFlag.run(r.id);
        }
      }
    }
  });
  tx();

  const online = results.filter((r) => r.status === 'online').length;
  const offline = results.filter((r) => r.status === 'offline').length;
  console.log(`Done: ${online}/${results.length} online, ${offline} offline`);
  return results;
}

function startCron(database) {
  const cron = require('node-cron');
  cron.schedule('0 4 * * 0', () => {
    console.log(`[${new Date().toISOString()}] Running weekly status check`);
    runChecks(database).catch(console.error);
  });
  console.log('Status checker cron scheduled (weekly, Sunday at 4am)');
}

// CLI mode: node backend/jobs/status-checker.js --once
if (require.main === module) {
  db = require('../db');
  runChecks(db).then((results) => {
    for (const r of results) {
      const icon = r.status === 'online' ? '●' : '○';
      const ms = r.response_time ? `${r.response_time}ms` : '-';
      console.log(`  ${icon} ${r.name} — ${r.status} (${ms})`);
    }
    process.exit(0);
  });
}

module.exports = { checkHost, runChecks, startCron };
