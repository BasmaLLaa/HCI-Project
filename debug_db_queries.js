const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('budget.db');

const userId = 1;
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();
const monthParam = String(currentMonth).padStart(2,'0');
console.log('currentMonth', currentMonth, 'monthParam', monthParam, 'currentYear', currentYear);

function runSql(sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL error:', err.message);
        resolve(null);
      } else {
        resolve(rows);
      }
    });
  });
}

(async () => {
  const incomeRows = await runSql(`SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`, [userId, monthParam, currentYear]);
  console.log('incomeRows:', incomeRows);

  const expenseRows = await runSql(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`, [userId, monthParam, currentYear]);
  console.log('expenseRows:', expenseRows);

  const categories = await runSql(`SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ? GROUP BY category`, [userId, monthParam, currentYear]);
  console.log('categories:', categories);

  const budget = await runSql(`SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?`, [userId, currentMonth, currentYear]);
  console.log('budget:', budget);

  const incomeStrftime = await runSql(`SELECT id, date, amount, strftime('%m', date) as m, strftime('%Y', date) as y FROM income WHERE user_id = ?`, [userId]);
  console.log('income with strftime:', incomeStrftime);

  const expenseStrftime = await runSql(`SELECT id, date, amount, category, strftime('%m', date) as m, strftime('%Y', date) as y FROM expenses WHERE user_id = ?`, [userId]);
  console.log('expenses with strftime:', expenseStrftime);

  // Try querying with year as string
  const incomeRowsYearString = await runSql(`SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`, [userId, monthParam, String(currentYear)]);
  console.log('incomeRows with year as string:', incomeRowsYearString);

  const expenseRowsYearString = await runSql(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`, [userId, monthParam, String(currentYear)]);
  console.log('expenseRows with year as string:', expenseRowsYearString);

  db.close();
})();
