const dns = require('dns');
const net = require('net');

// Private/internal IP ranges that should never be connected to
const BLOCKED_CIDRS = [
  // IPv4
  { prefix: '127.', label: 'loopback' },
  { prefix: '10.', label: 'private (10.x)' },
  { prefix: '0.', label: 'unspecified' },
  { label: 'private (172.16-31.x)', test: (ip) => {
    const m = ip.match(/^172\.(\d+)\./);
    return m && parseInt(m[1]) >= 16 && parseInt(m[1]) <= 31;
  }},
  { prefix: '192.168.', label: 'private (192.168.x)' },
  { prefix: '169.254.', label: 'link-local' },
  { prefix: '100.64.', label: 'CGNAT' },
  { prefix: '198.18.', label: 'benchmark' },
  { prefix: '198.19.', label: 'benchmark' },
  { prefix: '192.0.0.', label: 'IETF protocol' },
  // IPv6
  { prefix: '::1', label: 'loopback (IPv6)' },
  { prefix: 'fc', label: 'private (IPv6 fc)' },
  { prefix: 'fd', label: 'private (IPv6 fd)' },
  { prefix: 'fe80:', label: 'link-local (IPv6)' },
];

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal'];

function isBlockedIP(ip) {
  if (!ip) return true;
  const normalized = ip.toLowerCase().replace(/^::ffff:/, '');
  if (normalized === '::' || normalized === '0.0.0.0') return true;
  for (const rule of BLOCKED_CIDRS) {
    if (rule.prefix && normalized.startsWith(rule.prefix)) return true;
    if (rule.test && rule.test(normalized)) return true;
  }
  return false;
}

function isBlockedHostname(host) {
  const h = host.toLowerCase().trim();
  if (BLOCKED_HOSTNAMES.includes(h)) return true;
  if (net.isIP(h)) return isBlockedIP(h);
  return false;
}

// Resolve hostname and check if any resolved IP is internal
function resolveAndValidate(host) {
  return new Promise((resolve, reject) => {
    if (net.isIP(host)) {
      if (isBlockedIP(host)) {
        return reject(new Error(`Blocked: ${host} resolves to a private/internal address`));
      }
      return resolve(host);
    }

    if (isBlockedHostname(host)) {
      return reject(new Error(`Blocked: ${host} is a restricted hostname`));
    }

    dns.resolve4(host, (err, addresses) => {
      if (err) {
        // Try IPv6
        dns.resolve6(host, (err6, addr6) => {
          if (err6) return reject(new Error(`Cannot resolve hostname: ${host}`));
          for (const addr of addr6) {
            if (isBlockedIP(addr)) {
              return reject(new Error(`Blocked: ${host} resolves to a private/internal address`));
            }
          }
          resolve(addr6[0]);
        });
        return;
      }
      for (const addr of addresses) {
        if (isBlockedIP(addr)) {
          return reject(new Error(`Blocked: ${host} resolves to a private/internal address`));
        }
      }
      resolve(addresses[0]);
    });
  });
}

module.exports = { isBlockedIP, isBlockedHostname, resolveAndValidate };
