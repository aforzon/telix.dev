const net = require('net');

let db;
try { db = require('../db'); } catch { /* loaded standalone */ }

function checkHost(host, port, timeout = 5000) {
  return new Promise((resolve) => {
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

    socket.connect(port, host);
  });
}

async function checkBatch(entries, concurrency = 10) {
  const results = [];
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const checks = batch.map(async (entry) => {
      const result = await checkHost(entry.host, entry.port);
      return { id: entry.id, name: entry.name, ...result };
    });
    results.push(...(await Promise.all(checks)));
  }
  return results;
}

async function runChecks(database) {
  const d = database || db;
  const entries = d.prepare('SELECT id, name, host, port, status AS prev_status, flagged FROM entries WHERE flagged < 10').all();
  console.log(`Checking ${entries.length} entries...`);

  const results = await checkBatch(entries);
  const update = d.prepare(
    'UPDATE entries SET status = ?, response_time = ?, last_checked = datetime(\'now\') WHERE id = ?'
  );
  const incFlag = d.prepare('UPDATE entries SET flagged = flagged + 1 WHERE id = ?');

  const tx = d.transaction(() => {
    for (const r of results) {
      update.run(r.status, r.response_time, r.id);

      // Auto-flag entries that are offline: increment flagged count each check
      // After 5 consecutive offline checks, entry gets hidden (flagged >= 5)
      if (r.status === 'offline') {
        const entry = entries.find(e => e.id === r.id);
        if (entry && entry.prev_status === 'offline') {
          incFlag.run(r.id);
        }
      }
    }
  });
  tx();

  const online = results.filter((r) => r.status === 'online').length;
  const flagged = results.filter((r) => r.status === 'offline').length;
  console.log(`Done: ${online}/${results.length} online, ${flagged} offline`);
  return results;
}

function startCron(database) {
  const cron = require('node-cron');
  cron.schedule('0 4 * * *', () => {
    console.log(`[${new Date().toISOString()}] Running daily status check`);
    runChecks(database).catch(console.error);
  });
  console.log('Status checker cron scheduled (daily at 4am)');
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
