const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

db.all('SELECT id,date,amount FROM income UNION ALL SELECT id,date,amount FROM expenses ORDER BY date DESC', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Income/Expenses records with dates:');
    console.table(rows);
  }
  db.close();
});
