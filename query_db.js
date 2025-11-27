const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

function dump(table) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) return resolve({ table, error: err.message, rows: [] });
      resolve({ table, rows });
    });
  });
}

(async () => {
  const tables = ['users','income','expenses','budgets','budget_categories','goals'];
  for (const t of tables) {
    const res = await dump(t);
    console.log('---', res.table, '---');
    if (res.error) {
      console.log('Error:', res.error);
    } else if (!res.rows || res.rows.length === 0) {
      console.log('(no rows)');
    } else {
      console.table(res.rows);
    }
  }
  db.close();
})();
