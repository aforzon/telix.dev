CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'telnet',
    description TEXT NOT NULL,
    long_desc TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    tags TEXT DEFAULT '[]',
    submitted_by TEXT DEFAULT 'anonymous',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    last_checked DATETIME,
    status TEXT DEFAULT 'unknown',
    response_time INTEGER,
    country TEXT,
    url TEXT,
    submitted_by_ip TEXT,
    flagged INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'approved',  -- pending|approved|rejected
    UNIQUE(host, port)
);

CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    voter_ip TEXT NOT NULL,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    UNIQUE(entry_id, voter_ip)
);

CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    flagger_ip TEXT NOT NULL,
    flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    UNIQUE(entry_id, flagger_ip)
);

CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_upvotes ON entries(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_entries_moderation ON entries(moderation_status);
