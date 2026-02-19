# telix.dev

**The community phonebook for the terminal internet.**

BBSes, MUDs, ASCII art servers, Gopher holes, tilde servers, IRC networks, and the weird wonderful corners of the connected world — all in one directory, with a retro DOS terminal UI.

> Yellow Pages for the terminal-curious internet. The weird, fun, underground layer most people don't know exists.

## Try it now

**[telix.dev](https://telix.dev)**

Browse the directory. Click an entry. Hit Connect. You're in.

```bash
# Or from your own terminal:
telnet towel.blinkenlights.nl        # Star Wars in ASCII
telnet telehack.com                   # Simulated 1980s internet
curl wttr.in                          # Weather in your terminal
```

## What's inside

- **1,300+ entries** across 14 categories, community-submitted and auto-pinged daily
- **In-browser terminal** — one-click connect to telnet/raw TCP via xterm.js
- **Retro DOS UI** — CGA 16-color palette, box-drawing borders, CRT scanline effect, Perfect DOS VGA 437 font
- **Keyboard-driven** — arrow keys, `/` to search, `!` for random dial, `S` to submit
- **Status checking** — daily TCP pings show what's alive right now
- **Community submissions** — with auto-ping verification and moderation queue

Inspired by [Telix](https://en.wikipedia.org/wiki/Telix), the DOS-era terminal program that had a phonebook of BBS numbers you'd scroll through, pick one, and connect.

## Categories

| | |
|---|---|
| `bbs` — Bulletin Board Systems | `mud` — MUDs, MUSHes, MOOs |
| `game` — Text games, interactive fiction | `ascii-art` — ANSI/ASCII art servers |
| `network-tool` — Weather, traceroute, looking glasses | `sandbox` — Tilde servers, public shells |
| `irc` — IRC networks | `chat` — Other chat systems |
| `api` — Curl-able APIs | `gopher` — Gopher holes |
| `gemini` — Gemini capsules | `finger` — Finger servers |
| `radio` — CLI internet radio | `other` — Everything else |

## Self-host

```bash
git clone https://github.com/aforzon/telix.dev.git
cd telix.dev
npm install
cp .env.example .env
npm run seed        # 91 starter entries
npm start           # http://localhost:3000
```

Requires Node.js 18+. Database auto-creates on first run. No build step.

### Production deploy

```bash
# Nginx + Cloudflare Origin cert
mkdir -p /etc/ssl/telix.dev
# Download origin cert from Cloudflare Dashboard → SSL/TLS → Origin Server
cp nginx/telix-ratelimit.conf /etc/nginx/conf.d/
cp nginx/telix.dev /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/telix.dev /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Process manager
npm install -g pm2
pm2 start backend/server.js --name telix-dev
pm2 save && pm2 startup
```

## Tech stack

Vanilla HTML/CSS/JS. Node.js + Express. SQLite. xterm.js. That's it.

No frameworks. No build tools. No dependencies you wouldn't understand.

## API

All endpoints return JSON. Full docs at [telix.dev](https://telix.dev) (press `?` for help).

```bash
curl https://telix.dev/api/entries/stats          # Category counts
curl https://telix.dev/api/entries?category=bbs    # Browse BBSes
curl https://telix.dev/api/entries/random           # Random online entry
```

## Contributing

**Submit entries** at [telix.dev](https://telix.dev) — press `S` or click Submit.

**Code contributions** — fork, branch, PR.

## License

MIT

---

*In the beginning, there was the dialing directory. And it was good.*
