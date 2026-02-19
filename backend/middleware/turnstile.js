const https = require('https');

function verifyTurnstile(req, res, next) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return next(); // dev mode — skip verification

  const token = req.body?.['cf-turnstile-response'];
  if (!token) return res.status(400).json({ error: 'Missing Turnstile token' });

  const postData = JSON.stringify({
    secret,
    response: token,
    remoteip: req.ip,
  });

  const options = {
    hostname: 'challenges.cloudflare.com',
    path: '/turnstile/v0/siteverify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => (data += chunk));
    response.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.success) return next();
        res.status(403).json({ error: 'Turnstile verification failed' });
      } catch {
        res.status(500).json({ error: 'Turnstile verification error' });
      }
    });
  });

  request.on('error', () => {
    res.status(500).json({ error: 'Turnstile verification error' });
  });

  request.write(postData);
  request.end();
}

module.exports = verifyTurnstile;
