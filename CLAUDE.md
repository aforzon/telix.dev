# Telix.dev

## The Community Phonebook for the Terminal Internet

A community-curated directory of interesting things to connect to on the internet — BBSes, MUDs, ASCII art servers, network tools, text games, public sandboxes, and the weird wonderful corners of the connected world.

Inspired by Telix, the DOS-era terminal program that had a phonebook of BBS numbers you'd scroll through, pick one, and connect. Telix.dev brings that experience to the browser with a retro terminal aesthetic.

## The Pitch

> "Yellow Pages for the terminal-curious internet. The weird, fun, underground layer most people don't know exists."

## Core Concept

- A directory of "dialable" internet destinations — anything you can connect to
- Community submissions and upvotes surface the best stuff
- In-browser terminal for one-click connect (telnet/raw TCP)
- Retro terminal UI inspired by the original Telix DOS application
- Daily auto-pinging to show what's alive right now

## UI / Aesthetic Direction

The interface looks and feels like Telix from the DOS era:
- Dark background (deep blue `#0000AA`), bright text
- ANSI-style color palette (the classic 16 CGA/EGA colors)
- Monospace font throughout — Perfect DOS VGA 437 (`dos-vga.woff2`)
- Box-drawing characters for borders and frames (─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼)
- Status bar at bottom with keyboard shortcut buttons (? Help, R Refresh, / Search, ! Random, S Submit)
- Category-based landing page (like Telix's Alt-D dialing directory)
- Scrollable list with highlight bar and keyboard navigation
- Entry detail modals with connection commands
- Filter and sort controls in top bar
- No rounded corners, no gradients, no shadows — pure terminal aesthetic
- CRT scanline overlay effect (CSS)
- Mobile-responsive with touch-friendly controls

Reference: Search "Telix DOS terminal program" for screenshots of the original UI

## Data Model

### Entry (a "listing" in the phonebook)

```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
name            TEXT NOT NULL                      -- display name (max 64 chars)
host            TEXT NOT NULL                      -- hostname or IP (max 128 chars)
port            INTEGER NOT NULL                   -- port number (1-65535)
protocol        TEXT NOT NULL DEFAULT 'telnet'     -- telnet|ssh|http|https|raw|gopher|gemini|finger
description     TEXT NOT NULL                      -- short description (280 chars max)
long_desc       TEXT                               -- optional longer description
category        TEXT NOT NULL DEFAULT 'other'      -- see categories below
tags            TEXT DEFAULT '[]'                  -- JSON array of strings (max 5 tags, 24 chars each)
submitted_by    TEXT DEFAULT 'anonymous'           -- 'community' for user submissions
submitted_by_ip TEXT                               -- submitter IP (for rate limiting)
submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP
upvotes         INTEGER DEFAULT 0
last_checked    DATETIME                           -- timestamp of last TCP ping
status          TEXT DEFAULT 'unknown'             -- online|offline|unknown
response_time   INTEGER                            -- ms from last check
country         TEXT                               -- optional, for future geo display
url             TEXT                               -- optional web URL for more info
flagged         INTEGER DEFAULT 0                  -- moderation counter (hidden at >= 5)
UNIQUE(host, port)
```

### Votes

```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
entry_id        INTEGER NOT NULL REFERENCES entries(id)
voter_ip        TEXT NOT NULL
voted_at        DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(entry_id, voter_ip)
```

### Indexes
- `idx_entries_category` on `entries(category)`
- `idx_entries_status` on `entries(status)`
- `idx_entries_upvotes` on `entries(upvotes DESC)`

### Categories

```
bbs             - Bulletin Board Systems (still running!)
mud             - MUDs, MUSHes, MOOs — text-based multiplayer games
game            - Other text games, interactive fiction
ascii-art       - ANSI/ASCII art servers and galleries
network-tool    - Looking glasses, traceroute servers, weather, etc.
sandbox         - Public SSH sandboxes, shared shells, tilde servers
irc             - IRC networks and servers
chat            - Other chat systems
api             - Interesting curl-able APIs and services
gopher          - Gopher holes
gemini          - Gemini capsules
finger          - Finger servers
radio           - Internet radio streams accessible via CLI
other           - Everything else
```

### User Model

Not implemented yet. Currently anonymous — submissions tracked by IP, votes tracked by IP. No accounts, no auth.

Future: OAuth via GitHub would fit the audience.

## Features — Implemented (v0.1)

### The Phonebook (main view) ✅
- Category-based landing page showing categories with entry counts
- Scrollable list of entries in terminal-style table
- Columns: Status (●/○), Name, Protocol, Host:Port, Category, Upvotes
- Click to open detail modal
- Sort by: top voted, newest, name A-Z
- Filter by: category, protocol
- Full-text search across name, description, tags, host
- Pagination (50 entries per page)
- Keyboard navigation: Up/Down arrows, PgUp/PgDn, Enter to open, Esc to close
- Offline entries hidden by default (unless explicitly filtered)

### Submit Entry ✅
- In-app modal form: name, host, port, protocol, category, description, tags, URL
- Cloudflare Turnstile for spam protection (skipped in dev mode when no secret configured)
- Duplicate detection (same host:port)
- Input validation (lengths, required fields, port range)
- Rate limited: 1 submission per IP per 5 minutes

### Upvoting ✅
- One upvote per IP per entry (no auth required)
- Vote check endpoint to show if current IP has voted
- Transactional vote + upvote count update

### Status Checking ✅
- Daily cron job at 4am pings every entry via TCP connect (5s timeout)
- Batch checking with concurrency of 10
- Manual re-check available per entry via API (60s cooldown to prevent abuse)
- Status indicators in list: green = online, red = offline, grey = unknown
- Auto-flagging: entries that stay offline across consecutive checks get flagged incrementally
- Entries hidden when flagged >= 5 (consecutive offline checks)
- CLI mode: `npm run check` for one-off status sweep with per-entry output

### Entry Detail View ✅
- Full description display
- Connection command with one-click copy button
- Protocol-specific connection instructions:
  - telnet: `telnet host port`
  - ssh: `ssh host -p port`
  - http/https: direct link
  - gopher: `lynx gopher://host:port`
  - gemini: `gemini://host:port`
  - finger: `finger @host`
  - raw: `nc host port`
- Last checked timestamp and response time
- Upvote button (disables after voting)
- Flag/report button (one flag per IP per entry)
- Tags display
- Deep linking via `#entry-{id}` URL hash

### In-Browser Terminal ✅
- Embedded xterm.js terminal (vendored, no CDN)
- One-click "Connect" button on telnet and raw TCP entries
- WebSocket proxy on backend (`/ws/terminal`) bridges browser to remote host
- 1 connection per IP limit
- 2-minute idle timeout, 20-minute max session
- 10-second connection timeout
- Session timer displayed in terminal title bar
- Disconnect button
- Mobile input support with dedicated text field
- Admin endpoint to view active sessions (`/api/admin/sessions` with key auth)

### Random Dial ✅
- "!" key or button — opens a random online entry

### Additional ✅
- Dynamic sitemap.xml
- 404 page with retro terminal aesthetic ("NO CARRIER")
- Google Analytics integration
- OpenGraph / Twitter Card meta tags
- Structured data (JSON-LD) with SearchAction
- WCAG accessibility: skip links, ARIA labels/roles, focus trapping in modals, screen reader announcements
- Privacy Policy and Terms of Use (accessible from Help modal)
- Tiered rate limiting: read (60/min), write (10/min), check (5/min), global (120/min)

## Features — Future (v0.2+)

- User accounts and profiles (GitHub OAuth)
- Personal "favorites" phonebook
- Comments/reviews on entries
- Entry screenshots (capture ANSI output as images)
- RSS feed of new submissions
- Curated collections ("Best BBSes", "MUD starter pack", "Network tools")
- Weekly digest email of new/trending entries
- Entry owner claims — let BBS sysops claim and manage their listing
- SSH terminal support (would require in-browser key management)
- Historical uptime tracking per entry
- Integration with banter.im for community discussion
- Export phonebook as Telix-compatible .fon file (fun easter egg)
- Geo display using country field

## Tech Stack

### Frontend
- Vanilla HTML/CSS/JS — no frameworks, no build step
- xterm.js for in-browser terminal (vendored at `frontend/vendor/xterm/`)
- CSS: custom terminal theme with CGA palette, box-drawing, CRT scanline effect
- Font: Perfect DOS VGA 437 (`frontend/fonts/dos-vga.woff2`)

### Backend
- Node.js + Express
- better-sqlite3 (WAL mode, foreign keys enabled)
- ws (WebSocket library for terminal proxy)
- node-cron (daily status checks)
- dotenv (environment config)

### Deployment
- Single server
- Cloudflare in front (Turnstile, DDoS protection, caching)
- Domain: telix.dev

## Seed Data

91 starter entries across all 14 categories, loaded via `npm run seed` (`backend/db/seed.js`). Includes:

- **BBSes** (8): Synchronet Demo, Level 29, Particles!, Black Flag, Capitol Shrill, Clutch, The Cave, Xibalba
- **MUDs** (10): Aardwolf, Achaea, Discworld, Alter Aeon, BatMUD, Realms of Despair, Threshold RPG, Legends of the Jedi, HellMOO, Sindome
- **Network Tools**: wttr.in, ifconfig.me, Star Wars ASCII, MapSCII, and more
- **Tilde Servers**: tilde.town, tilde.club, SDF, rawtext.club, texto-plano.xyz
- **Gopher/Gemini/Finger** servers
- **IRC**: Libera.Chat, OFTC, EFnet, Undernet, DALnet, Rizon
- **Fun**: Nyan Cat, Telehack, Nethack, and more

## Launch Strategy

1. ~~Seed with 50-100 verified entries across categories~~ ✅ 91 entries seeded
2. Post on Hacker News: "I built the Telix phonebook for the modern internet"
3. Share on r/selfhosted, r/retrobattlestations, r/bbs, r/MUD, r/vintagecomputing
4. Cross-promote with banter.im community
5. Submit to Lobste.rs
6. Tildeverse community would love this

## Success Metrics

- Entries submitted by community (not just seed data)
- Return visitors
- Upvote activity
- Terminal connect clicks
- HN/Reddit discussion

## File Structure

```
telix.dev/
├── frontend/
│   ├── index.html               # Main SPA (with SEO meta, structured data, analytics)
│   ├── 404.html                 # 404 error page ("NO CARRIER")
│   ├── css/
│   │   └── terminal.css         # DOS terminal theme — CGA palette, box-drawing, CRT effect
│   ├── js/
│   │   ├── app.js               # Core: state, API helpers, modals, keyboard shortcuts, submit form, help
│   │   ├── phonebook.js         # Category menu, entry list, filtering, sorting, pagination
│   │   ├── detail.js            # Entry detail modal, connection commands, voting, flagging
│   │   └── terminal.js          # xterm.js terminal view, WebSocket client, session management
│   ├── fonts/
│   │   └── dos-vga.woff2        # Perfect DOS VGA 437 bitmap font
│   └── vendor/
│       └── xterm/
│           ├── xterm.min.js     # xterm.js terminal emulator
│           ├── addon-fit.min.js # xterm fit addon
│           └── xterm.min.css    # xterm styles
├── backend/
│   ├── server.js                # Express server, rate limiting, static files, sitemap, 404
│   ├── routes/
│   │   ├── entries.js           # GET list/detail/random/stats, POST submit, POST flag
│   │   ├── votes.js             # POST vote, GET vote check
│   │   ├── check.js             # POST manual status check (with cooldown)
│   │   └── terminal.js          # WebSocket terminal proxy (telnet/raw TCP)
│   ├── db/
│   │   ├── index.js             # SQLite init (auto-creates data/ dir, runs schema, WAL mode)
│   │   ├── schema.sql           # Tables: entries, votes + indexes
│   │   └── seed.js              # 91 starter entries across all categories
│   ├── jobs/
│   │   └── status-checker.js    # Cron scheduler (daily 4am) + batch TCP checker + CLI mode
│   └── middleware/
│       └── turnstile.js         # Cloudflare Turnstile verification (passthrough in dev)
├── data/                        # SQLite database directory (auto-created, gitignored)
│   └── telix.db                 # Database file (created at runtime)
├── package.json                 # Scripts: start, dev, seed, check, test
├── .env.example                 # PORT, TURNSTILE_SECRET_KEY, TURNSTILE_SITE_KEY
├── .gitignore                   # node_modules/, data/*.db, .env, *.log, *.pem
├── CLAUDE.md                    # This file — project spec and living doc
└── README.md                    # Public-facing documentation
```

## API Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `GET` | `/api/entries` | List entries (`?category`, `?protocol`, `?status`, `?sort`, `?search`, `?page`) | read |
| `GET` | `/api/entries/stats` | Category counts + online total | read |
| `GET` | `/api/entries/random` | Random online entry | read |
| `GET` | `/api/entries/:id` | Single entry detail | read |
| `POST` | `/api/entries` | Submit new entry (Turnstile protected) | write |
| `POST` | `/api/entries/:id/flag` | Flag entry (1 per IP per entry) | write |
| `POST` | `/api/votes/:id` | Upvote entry (1 per IP per entry) | write |
| `GET` | `/api/votes/:id/check` | Check if current IP has voted | read |
| `POST` | `/api/check/:id` | Manual status check (60s cooldown) | check |
| `GET` | `/api/admin/sessions` | View active terminal sessions (requires `ADMIN_KEY`) | - |
| `WS` | `/ws/terminal?id={entryId}` | WebSocket terminal proxy | 1 per IP |

## Notes

- Keep it fun. This is a passion project, not enterprise software.
- The terminal aesthetic IS the product. If it doesn't feel like sitting at a DOS machine in 1993, it's wrong.
- Don't over-engineer. SQLite, one server, simple code.
- The community makes or breaks it — make submitting dead simple.
- Star Wars ASCII telnet is the demo everyone will try first. Make sure it works.
- Turnstile verification is skipped when `TURNSTILE_SECRET_KEY` is not set (dev mode).
- Database auto-creates on first `npm start` — no manual SQLite setup needed.
- The submit form is integrated into `app.js`, not a separate `submit.js` file.
