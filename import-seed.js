const fs = require('fs');
const db = require('./backend/db');

const file = process.argv[2] || 'seed.sql';
const sql = fs.readFileSync(file, 'utf8');

// Split by INSERT statements
const statements = sql.split(/;\s*\n/).filter(s => s.trim().startsWith('INSERT'));

let imported = 0;
let skipped = 0;
let errors = 0;

for (const stmt of statements) {
  try {
    db.exec(stmt.trim() + ';');
    imported++;
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      skipped++;
    } else {
      errors++;
      console.error('Error:', err.message);
      console.error('Statement:', stmt.substring(0, 100) + '...');
    }
  }
}

console.log(`Import complete: ${imported} added, ${skipped} duplicates skipped, ${errors} errors`);
