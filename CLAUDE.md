# Telix.dev

## The Community Phonebook for the Terminal Internet

A community-curated directory of interesting things to connect to on the internet — BBSes, MUDs, ASCII art servers, network tools, text games, public sandboxes, and the weird wonderful corners of the connected world.

Inspired by Telix, the DOS-era terminal program that had a phonebook of BBS numbers you'd scroll through, pick one, and connect. Telix.dev brings that experience to the browser with a retro terminal aesthetic.

## The Pitch

> "Yellow Pages for the terminal-curious internet. The weird, fun, underground layer most people don't know exists."

## Core Concept

- A directory of "dialable" internet destinations — anything you can connect to
- Community submissions and upvotes surface the best stuff
- Optional in-browser terminal for one-click connect (telnet/SSH where possible)
- Retro terminal UI inspired by the original Telix DOS application
- Auto-pinging to show what's alive right now

## UI / Aesthetic Direction

The interface should look and feel like Telix from the DOS era:
- Dark background (deep blue or black), bright text
- ANSI-style color palette (the classic 16 CGA/EGA colors)
- Monospace font throughout (like DOS)
- Box-drawing characters for borders and frames (─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼)
- Status bar at bottom (like Telix's function key bar: F1-Help F2-Dial F3-...)
- The phonebook should feel like Telix's Alt-D dialing directory
- Scrollable list with highlight bar
- Entry details panel
- Sort and filter controls
- No rounded corners, no gradients, no shadows — pure terminal aesthetic
- Blinking cursor where appropriate
- Consider scanline effect or subtle CRT curvature as optional CSS flourish

Reference: Search "Telix DOS terminal program" for screenshots of the original UI

## Data Model

### Entry (a "listing" in the phonebook)

```
id              - unique identifier
name            - display name (e.g., "Synchronet BBS")
host            - hostname or IP
port            - port number
protocol        - telnet | ssh | http | https | raw | gopher | gemini | finger
description     - short description (280 chars max)
long_desc       - optional longer description / notes
category        - enum (see categories below)
tags            - array of strings
submitted_by    - username or anonymous
submitted_at    - timestamp
upvotes         - count
last_checked    - timestamp of last auto-ping
status          - online | offline | unknown
response_time   - ms from last check
country         - optional, for geo display
url             - optional web URL for more info
```

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
finger          - Finger servers (tie-in to AFP?)
radio           - Internet radio streams accessible via CLI
other           - Everything else
```

### User

```
id              - unique identifier
username        - display name
created_at      - timestamp
submissions     - count
reputation      - based on submission upvotes
```

Keep auth lightweight — OAuth via GitHub would fit the audience. Or anonymous submissions with Turnstile.

## Features — MVP (v0.1)

### The Phonebook (main view)
- Scrollable list of entries in terminal-style table
- Columns: Status (●/○), Name, Protocol, Host:Port, Category, Upvotes
- Click to expand details panel
- Sort by: newest, most upvoted, recently online, category
- Filter by: category, protocol, status (online/offline/all)
- Search across name, description, tags

### Submit Entry
- Simple form: name, host, port, protocol, category, description, tags
- Turnstile for spam protection
- Auto-check if host:port responds on submission
- Duplicate detection (same host:port)

### Upvoting
- One upvote per IP per entry (no auth required for MVP)
- Or require lightweight auth (GitHub OAuth)

### Status Checking
- Cron job pings every entry periodically (hourly? daily?)
- TCP connect check — is the port open?
- Store last_checked timestamp and response_time
- Show status indicator in list (green dot = online, red = offline, grey = unknown)
- Historical uptime would be nice later but not MVP

### Entry Detail View
- Full description
- Connection info with copy button
- Protocol-specific connection instructions:
  - telnet: `telnet host port`
  - ssh: `ssh user@host -p port`
  - http/https: link
  - gopher: `lynx gopher://host:port`
  - finger: `finger @host`
- Last checked / response time
- Upvote button
- "Report" link for dead/spam entries

### In-Browser Terminal (stretch goal for MVP)
- Embedded xterm.js terminal
- One-click "Connect" button on entries
- WebSocket proxy on backend for telnet connections
- SSH would require more work (authentication) — maybe later
- This is the killer feature but can be v0.2

## Features — Future (v0.2+)

- In-browser terminal via xterm.js + WebSocket proxy
- User accounts and profiles
- Personal "favorites" phonebook
- Comments/reviews on entries
- Entry screenshots (capture ANSI output as images)
- "Random dial" button — connect to a random online entry
- RSS feed of new submissions
- API for programmatic access
- Curated collections ("Best BBSes", "MUD starter pack", "Network tools")
- Weekly digest email of new/trending entries
- Entry owner claims — let BBS sysops claim and manage their listing
- Integration with banter.im for community discussion
- Mobile-friendly (terminal UI adapts)
- Export phonebook as Telix-compatible .fon file (fun easter egg)

## Tech Stack

### Frontend
- React or plain HTML/JS — keep it simple
- xterm.js for in-browser terminal (when ready)
- CSS: custom terminal theme, no frameworks
- Fonts: Use a proper DOS/terminal font — "IBM Plex Mono", "Iosevka", or actual bitmap font like "Perfect DOS VGA 437"

### Backend
- Node.js (Express or Fastify) — OR Go for single-binary simplicity
- SQLite for database (simple, no external deps, easy backup)
- Cron for status checks (simple TCP connect)

### Deployment
- Single server (start on one OVH box)
- Cloudflare in front (Turnstile, DDoS protection, caching)
- Docker optional but not required
- Domain: telix.dev

## Seed Data — Starter Phonebook

The directory can't launch empty. Seed it with known-good entries:

### BBSes
- Synchronet BBS Demo: telnet://demo.synchro.net
- Level 29: telnet://bbs.fozztexx.com
- Particles BBS: telnet://particlesbbs.dyndns.org:6400

### MUDs
- Aardwolf: telnet://aardmud.org:4000
- Achaea: telnet://achaea.com:23
- Discworld MUD: telnet://discworld.starturtle.net:4242

### Network Tools
- Weather: curl wttr.in
- IP info: curl ifconfig.me
- Star Wars ASCII: telnet://towel.blinkenlights.nl
- Telnet map: telnet://mapscii.me

### Tilde Servers
- tilde.town: ssh://tilde.town
- tilde.club: ssh://tilde.club
- sdf.org: ssh://sdf.org (public access unix)

### Gopher
- Floodgap: gopher://gopher.floodgap.com
- SDF Gopher: gopher://sdf.org

### Finger
- Any AFP-enabled servers (your own?)

### Fun
- Nyan Cat: telnet://nyancat.dakko.us
- Telehack: telnet://telehack.com (simulated 1980s internet!)
- 2600 BBS: telnet://2600.america.com

Research and verify all of these before launch — some may be down.

## Launch Strategy

1. Seed with 50-100 verified entries across categories
2. Post on Hacker News: "I built the Telix phonebook for the modern internet"
3. Share on r/selfhosted, r/retrobattlestations, r/bbs, r/MUD, r/vintage computing
4. Cross-promote with banter.im community
5. Submit to Lobste.rs
6. Tildeverse community would love this

## Success Metrics

- Entries submitted by community (not just seed data)
- Return visitors
- Upvote activity
- "Connect" clicks (when terminal is ready)
- HN/Reddit discussion

## File Structure (suggested)

```
telix/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── terminal.css         # The retro terminal theme
│   ├── js/
│   │   ├── app.js               # Main app logic
│   │   ├── phonebook.js         # Phonebook list/filter/sort
│   │   ├── detail.js            # Entry detail view
│   │   ├── submit.js            # Submission form
│   │   └── terminal.js          # xterm.js integration (v0.2)
│   └── fonts/
│       └── dos-vga.woff2        # DOS bitmap font
├── backend/
│   ├── server.js                # Express/Fastify server
│   ├── routes/
│   │   ├── entries.js           # CRUD for phonebook entries
│   │   ├── votes.js             # Upvote handling
│   │   └── check.js             # Status check endpoints
│   ├── db/
│   │   ├── schema.sql           # SQLite schema
│   │   └── seed.sql             # Starter phonebook data
│   ├── jobs/
│   │   └── status-checker.js    # Cron: ping all entries
│   └── middleware/
│       └── turnstile.js         # Cloudflare Turnstile verification
├── package.json
├── Dockerfile                   # Optional
├── .env.example
└── README.md
```

## Database Schema

```sql
CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'telnet',
    description TEXT NOT NULL,
    long_desc TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    tags TEXT DEFAULT '[]',           -- JSON array
    submitted_by TEXT DEFAULT 'anonymous',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    last_checked DATETIME,
    status TEXT DEFAULT 'unknown',    -- online, offline, unknown
    response_time INTEGER,            -- ms
    country TEXT,
    url TEXT,
    flagged INTEGER DEFAULT 0,        -- for moderation
    UNIQUE(host, port)
);

CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    voter_ip TEXT NOT NULL,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    UNIQUE(entry_id, voter_ip)
);

CREATE INDEX idx_entries_category ON entries(category);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entries_upvotes ON entries(upvotes DESC);
```

## Notes

- Keep it fun. This is a passion project, not enterprise software.
- The terminal aesthetic IS the product. If it doesn't feel like sitting at a DOS machine in 1993, it's wrong.
- Don't over-engineer. SQLite, one server, simple code.
- The community makes or breaks it — make submitting dead simple.
- Star Wars ASCII telnet is the demo everyone will try first. Make sure it works.


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 19, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #5649 | 1:11 AM | 🔵 | Telix.dev Project Spec: Community Phonebook for the Terminal Internet | ~659 |
| #5631 | 12:56 AM | 🔵 | telix.dev Project Specification Discovered in CLAUDE.md | ~746 |
| #5629 | 12:50 AM | 🔵 | Telix.dev — Community Phonebook for the Terminal Internet | ~491 |
</claude-mem-context>