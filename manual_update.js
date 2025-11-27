const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

console.log('Updating goal 1 current_amount to 500...');
db.run('UPDATE goals SET current_amount = ? WHERE id = ?', [500, 1], function(err) {
  if (err) {
    console.error('Update error:', err.message);
  } else {
    console.log('Rows changed:', this.changes);
  }
  
  // Verify
  db.get('SELECT * FROM goals WHERE id = 1', [], (err, row) => {
    console.log('\nAfter update:');
    console.log(row);
    db.close();
  });
});
