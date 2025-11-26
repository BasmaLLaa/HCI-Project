const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('budget.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Budgets table
  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_budget REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Budget categories table
  db.run(`CREATE TABLE IF NOT EXISTS budget_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    FOREIGN KEY (budget_id) REFERENCES budgets(id)
  )`);

  // Expenses table
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Income table
  db.run(`CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Goals table
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal_name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.status(201).json({ 
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    }
  );
});

// Get Dashboard Data
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get total income for current month
  db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM income 
     WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
    [userId, String(currentMonth).padStart(2, '0'), currentYear],
    (err, incomeResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get total expenses for current month
      db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
        [userId, String(currentMonth).padStart(2, '0'), currentYear],
        (err, expenseResult) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get expenses by category
          db.all(
            `SELECT category, SUM(amount) as total FROM expenses 
             WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
             GROUP BY category`,
            [userId, String(currentMonth).padStart(2, '0'), currentYear],
            (err, categoryExpenses) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              // Get budget for current month
              db.get(
                'SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
                [userId, currentMonth, currentYear],
                (err, budget) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  // Get goals
                  db.all(
                    'SELECT * FROM goals WHERE user_id = ?',
                    [userId],
                    (err, goals) => {
                      if (err) {
                        return res.status(500).json({ error: 'Database error' });
                      }

                      res.json({
                        totalIncome: incomeResult.total || 0,
                        totalExpenses: expenseResult.total || 0,
                        balance: (incomeResult.total || 0) - (expenseResult.total || 0),
                        expensesByCategory: categoryExpenses || [],
                        budget: budget || null,
                        goals: goals || []
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Create Budget
app.post('/api/budgets', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { month, year, totalBudget, categories } = req.body;

  if (!month || !year || !totalBudget) {
    return res.status(400).json({ error: 'Month, year, and total budget are required' });
  }

  db.run(
    'INSERT INTO budgets (user_id, month, year, total_budget) VALUES (?, ?, ?, ?)',
    [userId, month, year, totalBudget],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const budgetId = this.lastID;

      // Insert budget categories
      if (categories && categories.length > 0) {
        const stmt = db.prepare('INSERT INTO budget_categories (budget_id, category_name, limit_amount) VALUES (?, ?, ?)');
        categories.forEach(category => {
          stmt.run([budgetId, category.name, category.limit]);
        });
        stmt.finalize();
      }

      res.status(201).json({ message: 'Budget created successfully', budgetId });
    }
  );
});

// Get Budgets
app.get('/api/budgets', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC',
    [userId],
    (err, budgets) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get categories for each budget
      const budgetsWithCategories = budgets.map(budget => {
        return new Promise((resolve) => {
          db.all(
            'SELECT * FROM budget_categories WHERE budget_id = ?',
            [budget.id],
            (err, categories) => {
              if (err) {
                resolve({ ...budget, categories: [] });
              } else {
                resolve({ ...budget, categories: categories || [] });
              }
            }
          );
        });
      });

      Promise.all(budgetsWithCategories).then(results => {
        res.json(results);
      });
    }
  );
});

// Add Expense
app.post('/api/expenses', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { category, amount, description, date, isRecurring } = req.body;

  if (!category || !amount || !date) {
    return res.status(400).json({ error: 'Category, amount, and date are required' });
  }

  db.run(
    'INSERT INTO expenses (user_id, category, amount, description, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, category, amount, description || '', date, isRecurring ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ message: 'Expense added successfully', expenseId: this.lastID });
    }
  );
});

// Get Expenses
app.get('/api/expenses', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;

  let query = 'SELECT * FROM expenses WHERE user_id = ?';
  const params = [userId];

  if (month && year) {
    query += ' AND strftime("%m", date) = ? AND strftime("%Y", date) = ?';
    params.push(String(month).padStart(2, '0'), year);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, expenses) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(expenses.map(expense => ({
      ...expense,
      is_recurring: expense.is_recurring === 1
    })));
  });
});

// Update Expense
app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const expenseId = req.params.id;
  const { category, amount, description, date, isRecurring } = req.body;

  db.run(
    'UPDATE expenses SET category = ?, amount = ?, description = ?, date = ?, is_recurring = ? WHERE id = ? AND user_id = ?',
    [category, amount, description || '', date, isRecurring ? 1 : 0, expenseId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({ message: 'Expense updated successfully' });
    }
  );
});

// Delete Expense
app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const expenseId = req.params.id;

  db.run(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [expenseId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({ message: 'Expense deleted successfully' });
    }
  );
});

// Add Income
app.post('/api/income', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { source, amount, date } = req.body;

  if (!source || !amount || !date) {
    return res.status(400).json({ error: 'Source, amount, and date are required' });
  }

  db.run(
    'INSERT INTO income (user_id, source, amount, date) VALUES (?, ?, ?, ?)',
    [userId, source, amount, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ message: 'Income added successfully', incomeId: this.lastID });
    }
  );
});

// Get Income
app.get('/api/income', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;

  let query = 'SELECT * FROM income WHERE user_id = ?';
  const params = [userId];

  if (month && year) {
    query += ' AND strftime("%m", date) = ? AND strftime("%Y", date) = ?';
    params.push(String(month).padStart(2, '0'), year);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, income) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(income);
  });
});

// Update Income
app.put('/api/income/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const incomeId = req.params.id;
  const { source, amount, date } = req.body;

  db.run(
    'UPDATE income SET source = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?',
    [source, amount, date, incomeId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Income not found' });
      }

      res.json({ message: 'Income updated successfully' });
    }
  );
});

// Delete Income
app.delete('/api/income/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const incomeId = req.params.id;

  db.run(
    'DELETE FROM income WHERE id = ? AND user_id = ?',
    [incomeId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Income not found' });
      }

      res.json({ message: 'Income deleted successfully' });
    }
  );
});

// Add Goal
app.post('/api/goals', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { goalName, targetAmount, targetDate } = req.body;

  if (!goalName || !targetAmount) {
    return res.status(400).json({ error: 'Goal name and target amount are required' });
  }

  db.run(
    'INSERT INTO goals (user_id, goal_name, target_amount, target_date) VALUES (?, ?, ?, ?)',
    [userId, goalName, targetAmount, targetDate || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ message: 'Goal created successfully', goalId: this.lastID });
    }
  );
});

// Get Goals
app.get('/api/goals', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, goals) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(goals);
    }
  );
});

// Update Goal Progress
app.put('/api/goals/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { currentAmount, goalName, targetAmount, targetDate } = req.body;

  let query = 'UPDATE goals SET ';
  const params = [];

  if (currentAmount !== undefined) {
    query += 'current_amount = ?';
    params.push(currentAmount);
  } else if (goalName || targetAmount !== undefined || targetDate !== undefined) {
    const updates = [];
    if (goalName) {
      updates.push('goal_name = ?');
      params.push(goalName);
    }
    if (targetAmount !== undefined) {
      updates.push('target_amount = ?');
      params.push(targetAmount);
    }
    if (targetDate !== undefined) {
      updates.push('target_date = ?');
      params.push(targetDate);
    }
    query += updates.join(', ');
  } else {
    return res.status(400).json({ error: 'No fields to update' });
  }

  query += ' WHERE id = ? AND user_id = ?';
  params.push(goalId, userId);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal updated successfully' });
  });
});

// Delete Goal
app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;

  db.run(
    'DELETE FROM goals WHERE id = ? AND user_id = ?',
    [goalId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ message: 'Goal deleted successfully' });
    }
  );
});

// Get Reports
app.get('/api/reports', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  // Income vs Expenses
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
    (err, incomeVsExpenses) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Budget Variance
      db.all(
        `SELECT 
          b.month,
          b.year,
          b.total_budget,
          COALESCE(SUM(e.amount), 0) as actual_expenses,
          (b.total_budget - COALESCE(SUM(e.amount), 0)) as variance
        FROM budgets b
        LEFT JOIN expenses e ON e.user_id = b.user_id 
          AND strftime('%m', e.date) = printf('%02d', b.month)
          AND strftime('%Y', e.date) = printf('%d', b.year)
        WHERE b.user_id = ? AND 
          (printf('%d-%02d', b.year, b.month) BETWEEN ? AND ?)
        GROUP BY b.id
        ORDER BY b.year DESC, b.month DESC`,
        [userId, startDate.substring(0, 7), endDate.substring(0, 7)],
        (err, budgetVariance) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Savings Progress
          db.all(
            `SELECT 
              goal_name,
              target_amount,
              current_amount,
              (current_amount * 100.0 / target_amount) as progress_percentage
            FROM goals
            WHERE user_id = ?`,
            [userId],
            (err, savingsProgress) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                incomeVsExpenses: incomeVsExpenses || [],
                budgetVariance: budgetVariance || [],
                savingsProgress: savingsProgress || []
              });
            }
          );
        }
      );
    }
  );
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

