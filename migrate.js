const db = require('./backend/db');

// Add submitted_by_ip column if it doesn't exist
try {
  db.exec("ALTER TABLE entries ADD COLUMN submitted_by_ip TEXT");
  console.log('Added submitted_by_ip column');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('submitted_by_ip column already exists');
  } else {
    console.error('Error:', e.message);
  }
}

// Delete test entry
const deleted = db.prepare("DELETE FROM entries WHERE name = 'test'").run();
console.log('Deleted', deleted.changes, 'test entries');
