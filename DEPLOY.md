# Telix.dev Deployment

## Quick Deploy (run as root/sudo)

```bash
# 1. Create SSL directory and generate origin cert
#    (Or download Cloudflare Origin Certificate from dashboard)
mkdir -p /etc/ssl/telix.dev
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/telix.dev/origin-key.pem \
  -out /etc/ssl/telix.dev/origin.pem \
  -subj "/CN=telix.dev"

# 2. Install rate limit config
cp /var/www/telix.dev/nginx/telix-ratelimit.conf /etc/nginx/conf.d/

# 3. Install nginx site config
cp /var/www/telix.dev/nginx/telix.dev /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/telix.dev /etc/nginx/sites-enabled/

# 4. Test and reload nginx
nginx -t && systemctl reload nginx

# 5. Start the app (or use pm2/systemd)
cd /var/www/telix.dev
npm run seed   # seed the database
npm start      # start on port 3000
```

## Cloudflare Origin Certificate (recommended)
1. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
2. Hostnames: telix.dev, *.telix.dev
3. Save the cert to `/etc/ssl/telix.dev/origin.pem`
4. Save the key to `/etc/ssl/telix.dev/origin-key.pem`

## Process Manager (pm2)
```bash
npm install -g pm2
pm2 start backend/server.js --name telix
pm2 save
pm2 startup
```
