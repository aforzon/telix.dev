const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'telix.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrations — add columns if missing (run before schema to avoid column reference errors)
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'").get();
if (tableExists) {
  const columns = db.prepare("PRAGMA table_info(entries)").all().map(c => c.name);
  if (!columns.includes('moderation_status')) {
    db.exec("ALTER TABLE entries ADD COLUMN moderation_status TEXT DEFAULT 'approved'");
    db.exec("CREATE INDEX IF NOT EXISTS idx_entries_moderation ON entries(moderation_status)");
  }
}

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
