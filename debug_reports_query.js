const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

const userId = 1;
const startDate = '2024-01-01';
const endDate = '2025-11-27';

console.log('Testing Income vs Expenses query...');
console.log('Query parameters:', { userId, startDate, endDate });

db.all(
  `SELECT 
    strftime('%Y-%m', date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
  FROM (
    SELECT date, amount, 'income' as type FROM income WHERE user_id = ? AND date BETWEEN ? AND ?
    UNION ALL
    SELECT date, amount, 'expense' as type FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?
  )
  GROUP BY month
  ORDER BY month`,
  [userId, startDate, endDate, userId, startDate, endDate],
  (err, rows) => {
    if (err) {
      console.error('Query error:', err.message);
    } else {
      console.log('Query result:');
      console.table(rows);
    }
    
    // Also test raw income
    console.log('\nRaw income records:');
    db.all('SELECT * FROM income WHERE user_id = ? AND date BETWEEN ? AND ?', [userId, startDate, endDate], (e, r) => {
      console.table(r);
      
      // And raw expenses
      console.log('\nRaw expense records:');
      db.all('SELECT * FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?', [userId, startDate, endDate], (e, r) => {
        console.table(r);
        db.close();
      });
    });
  }
);
