const db = require('./backend/db');
const row = db.prepare("SELECT id, name, host FROM entries WHERE name LIKE '%test%' ORDER BY submitted_at DESC LIMIT 5").all();
console.log('Found:', row);
if (row.length) {
  db.prepare("DELETE FROM entries WHERE name = 'test'").run();
  console.log('Deleted entries named "test"');
}
