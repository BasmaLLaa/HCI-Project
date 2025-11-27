const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

db.all('SELECT * FROM goals', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Current goals in database:');
    console.table(rows);
  }
  db.close();
});
