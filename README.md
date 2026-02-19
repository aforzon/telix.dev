# telix.dev

**The Community Phonebook for the Terminal Internet**

A community-curated directory of interesting things to connect to on the internet — BBSes, MUDs, ASCII art servers, network tools, text games, public sandboxes, and the weird wonderful corners of the connected world.

Inspired by [Telix](https://en.wikipedia.org/wiki/Telix), the DOS-era terminal program that had a phonebook of BBS numbers you'd scroll through, pick one, and connect. telix.dev brings that experience to the browser with a retro terminal aesthetic.

> "Yellow Pages for the terminal-curious internet. The weird, fun, underground layer most people don't know exists."

## What Is This?

A directory of "dialable" internet destinations — anything you can connect to via terminal:

- **BBSes** — Bulletin Board Systems still running after all these years
- **MUDs** — Text-based multiplayer games (MUDs, MUSHes, MOOs)
- **Network Tools** — Weather via `curl`, ASCII maps, looking glasses
- **Tilde Servers** — Public SSH sandboxes and shared shells
- **Gopher & Gemini** — The small internet, alive and well
- **IRC** — Internet Relay Chat networks
- **Fun Stuff** — Star Wars in ASCII, Nyan Cat over telnet, Telehack

Community submissions and upvotes surface the best stuff. Daily auto-pinging shows what's alive right now.

## Features

### Phonebook Directory
- DOS-era terminal UI with CGA 16-color palette and box-drawing characters
- Category-based browsing menu (landing page shows categories with entry counts)
- Filter by category, protocol, and online status
- Sort by top voted, newest, or name
- Full-text search across names, descriptions, tags, and hosts
- Pagination (50 entries per page)
- Keyboard navigation (arrow keys, PgUp/PgDn, Enter to open, Esc to close)

### In-Browser Terminal
- One-click connect to telnet and raw TCP services via xterm.js
- WebSocket proxy bridges browser to remote hosts
- Session timer with 20-minute max and 2-minute idle timeout
- One connection per IP to prevent abuse
- Mobile input support with dedicated text field

### Entry Details
- Protocol-specific connection commands with one-click copy
- Status indicator (online/offline/unknown) with response time
- Upvoting (one vote per IP per entry)
- Flag/report system for dead or spam entries
- Deep linking via `#entry-{id}` URL hash

### Community Submissions
- Submit new entries through an in-app form
- Cloudflare Turnstile spam protection
- Duplicate detection (same host:port)
- Input validation (name, host, port, protocol, category, description)
- Rate limited to one submission per IP per 5 minutes

### Status Checking
- Daily cron job (4am) pings every entry via TCP connect
- Manual re-check available per entry (60s cooldown)
- Auto-flags entries that stay offline across consecutive checks
- Entries hidden after 5 consecutive offline checks
- CLI mode: `npm run check` for one-off status sweep

### Other
- Random dial button — connects you to a random online entry
- Dynamic sitemap.xml
- 404 page with retro aesthetic
- Google Analytics integration
- OpenGraph and Twitter Card meta tags
- Structured data (JSON-LD) for search engines
- WCAG accessibility: skip links, ARIA labels, focus trapping, screen reader announcements
- CRT scanline overlay effect

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no frameworks, no build step
- **Backend:** Node.js + Express
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **WebSocket:** ws library for terminal proxy
- **Status Checks:** node-cron + TCP connect
- **Spam Protection:** Cloudflare Turnstile
- **Terminal:** xterm.js with fit addon (vendored)
- **Font:** Perfect DOS VGA 437 (woff2)

## Project Structure

```
telix.dev/
├── frontend/
│   ├── index.html               # Main SPA
│   ├── 404.html                 # 404 error page
│   ├── css/
│   │   └── terminal.css         # DOS terminal theme (CGA palette, box-drawing, CRT effect)
│   ├── js/
│   │   ├── app.js               # Core app logic, state, modals, keyboard shortcuts
│   │   ├── phonebook.js         # Category menu, entry list, filtering, sorting, pagination
│   │   ├── detail.js            # Entry detail modal, connection commands, voting, flagging
│   │   └── terminal.js          # xterm.js terminal, WebSocket proxy client
│   ├── fonts/
│   │   └── dos-vga.woff2        # DOS VGA bitmap font
│   └── vendor/
│       └── xterm/               # Vendored xterm.js + fit addon
├── backend/
│   ├── server.js                # Express server, rate limiting, routes, sitemap, WebSocket attach
│   ├── routes/
│   │   ├── entries.js           # CRUD, search, filter, sort, pagination, submission, flagging
│   │   ├── votes.js             # Upvote + vote check endpoints
│   │   ├── check.js             # Manual status check endpoint (with cooldown)
│   │   └── terminal.js          # WebSocket terminal proxy (telnet/raw TCP)
│   ├── db/
│   │   ├── index.js             # SQLite init (auto-creates data/ dir and runs schema)
│   │   ├── schema.sql           # Tables: entries, votes + indexes
│   │   └── seed.js              # 91 starter entries across all categories
│   ├── jobs/
│   │   └── status-checker.js    # Cron scheduler + batch TCP checker + CLI mode
│   └── middleware/
│       └── turnstile.js         # Cloudflare Turnstile verification (skips in dev mode)
├── data/                        # SQLite database (created at runtime, gitignored)
├── package.json
├── .env.example
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/telix.dev.git
cd telix.dev

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Seed the database (91 entries across 14 categories)
npm run seed

# Start the server
npm start
```

The app will be available at `http://localhost:3000`. The database is auto-created on first run at `data/telix.db`.

### Development

```bash
# Start with auto-reload on file changes
npm run dev

# Run a one-off status check on all entries
npm run check
```

### Environment Variables

```
PORT=3000                    # Server port (default: 3000)
TURNSTILE_SECRET_KEY=        # Cloudflare Turnstile secret (optional — skipped in dev)
TURNSTILE_SITE_KEY=          # Cloudflare Turnstile site key
```

## API

All endpoints return JSON.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/entries` | List entries (supports `?category`, `?protocol`, `?status`, `?sort`, `?search`, `?page`) |
| `GET` | `/api/entries/stats` | Category counts and online total |
| `GET` | `/api/entries/random` | Random online entry |
| `GET` | `/api/entries/:id` | Single entry detail |
| `POST` | `/api/entries` | Submit new entry (Turnstile protected) |
| `POST` | `/api/entries/:id/flag` | Flag an entry (one per IP) |
| `POST` | `/api/votes/:id` | Upvote an entry (one per IP) |
| `GET` | `/api/votes/:id/check` | Check if current IP has voted |
| `POST` | `/api/check/:id` | Manually trigger status check |

### Rate Limits

| Action | Limit |
|--------|-------|
| Read (browsing) | 60 req/min per IP |
| Write (votes, flags) | 10 req/min per IP |
| Status checks | 5 req/min per IP |
| Global | 120 req/min per IP |
| Submissions | 1 per 5 minutes per IP |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate entries |
| `PgUp/PgDn` | Scroll page |
| `Enter` | View entry details |
| `Esc` | Close modal / disconnect terminal |
| `?` or `F1` | Help |
| `R` or `F5` | Refresh list |
| `/` | Focus search |
| `!` | Random dial |
| `S` | Submit new entry |

## Categories

| Category | Description |
|----------|-------------|
| `bbs` | Bulletin Board Systems |
| `mud` | MUDs, MUSHes, MOOs |
| `game` | Text games, interactive fiction |
| `ascii-art` | ANSI/ASCII art servers |
| `network-tool` | Looking glasses, weather, traceroute |
| `sandbox` | Public SSH sandboxes, tilde servers |
| `irc` | IRC networks and servers |
| `chat` | Other chat systems |
| `api` | Curl-able APIs and services |
| `gopher` | Gopher holes |
| `gemini` | Gemini capsules |
| `finger` | Finger servers |
| `radio` | CLI-accessible internet radio |
| `other` | Everything else |

## Supported Protocols

| Protocol | Connection Command |
|----------|-------------------|
| `telnet` | `telnet host port` |
| `ssh` | `ssh host -p port` |
| `http/https` | Direct link |
| `gopher` | `lynx gopher://host:port` |
| `gemini` | `gemini://host:port` |
| `finger` | `finger @host` |
| `raw` | `nc host port` |

## Contributing

Submit entries through the web interface — press `S` or click Submit in the status bar.

For code contributions:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
