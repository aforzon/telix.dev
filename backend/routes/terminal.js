/* ── Telix.dev — WebSocket Terminal Proxy ── */
const WebSocket = require('ws');
const net = require('net');
const db = require('../db');

const MAX_PER_IP = 1;
const IDLE_TIMEOUT = 2 * 60 * 1000;   // 2 minutes
const MAX_SESSION = 20 * 60 * 1000;   // 20 minutes
const CONNECT_TIMEOUT = 10_000;        // 10 seconds
const CONNECTABLE = ['telnet', 'raw'];

const ipConnections = new Map();
const activeSessions = [];

function attach(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname !== '/ws/terminal') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, request) => {
    const params = new URL(request.url, 'http://localhost').searchParams;
    const entryId = parseInt(params.get('id'));
    const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || request.socket.remoteAddress;

    // Connection limit per IP
    const count = ipConnections.get(ip) || 0;
    if (count >= MAX_PER_IP) {
      ws.close(4429, 'You already have an active connection. Disconnect first.');
      return;
    }

    if (!entryId) {
      ws.close(4400, 'Missing entry ID');
      return;
    }

    const entry = db.prepare(
      'SELECT id, host, port, protocol, name FROM entries WHERE id = ? AND flagged = 0'
    ).get(entryId);

    if (!entry) {
      ws.close(4404, 'Entry not found');
      return;
    }

    if (!CONNECTABLE.includes(entry.protocol)) {
      ws.close(4403, 'Protocol not supported for in-browser terminal');
      return;
    }

    // Track connection
    ipConnections.set(ip, count + 1);
    let cleaned = false;
    const sessionStart = Date.now();
    const session = { ip, entryId: entry.id, name: entry.name, host: entry.host, port: entry.port, startedAt: new Date().toISOString() };
    activeSessions.push(session);

    const remote = new net.Socket();

    // Idle timer
    let idleTimer = setTimeout(() => cleanup('Idle timeout (2 min)'), IDLE_TIMEOUT);
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => cleanup('Idle timeout (2 min)'), IDLE_TIMEOUT);
    };

    // Max session timer
    const sessionTimer = setTimeout(() => cleanup('Session limit reached (20 min)'), MAX_SESSION);

    function cleanup(reason) {
      if (cleaned) return;
      cleaned = true;

      clearTimeout(idleTimer);
      clearTimeout(sessionTimer);

      if (!remote.destroyed) remote.destroy();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[1;31m--- ${reason} ---\x1b[0m\r\n`);
        setTimeout(() => ws.close(1000, reason), 100);
      }

      const cur = ipConnections.get(ip) || 1;
      if (cur <= 1) ipConnections.delete(ip);
      else ipConnections.set(ip, cur - 1);

      const idx = activeSessions.indexOf(session);
      if (idx !== -1) activeSessions.splice(idx, 1);
    }

    remote.setTimeout(CONNECT_TIMEOUT);

    remote.on('connect', () => {
      remote.setTimeout(0);
      console.log(`[terminal] ${ip} connected to ${entry.host}:${entry.port}`);
    });

    remote.on('data', (data) => {
      resetIdle();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    remote.on('error', (err) => {
      cleanup(`Connection error: ${err.message}`);
    });

    remote.on('close', () => {
      cleanup('Remote host closed connection');
    });

    remote.on('timeout', () => {
      cleanup('Connection timed out');
    });

    ws.on('message', (data) => {
      resetIdle();
      if (!remote.destroyed) {
        remote.write(Buffer.isBuffer(data) ? data : Buffer.from(data));
      }
    });

    ws.on('close', () => {
      if (!cleaned) {
        cleaned = true;
        clearTimeout(idleTimer);
        clearTimeout(sessionTimer);
        if (!remote.destroyed) remote.destroy();

        const cur = ipConnections.get(ip) || 1;
        if (cur <= 1) ipConnections.delete(ip);
        else ipConnections.set(ip, cur - 1);

        const idx = activeSessions.indexOf(session);
        if (idx !== -1) activeSessions.splice(idx, 1);

        console.log(`[terminal] ${ip} disconnected from ${entry.host}:${entry.port}`);
      }
    });

    remote.connect(entry.port, entry.host);
  });

  console.log('WebSocket terminal proxy ready');
}

function getSessions() {
  return activeSessions.map(s => ({
    ...s,
    duration: Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000) + 's',
  }));
}

module.exports = { attach, getSessions };
