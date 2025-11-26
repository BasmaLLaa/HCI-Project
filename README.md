# Budget Tracking Website

A comprehensive web-based platform for managing personal finances, tracking income, expenses, budgets, and financial goals.

## Features

- **User Registration and Login**: Secure user authentication system
- **Dashboard**: Overview of financial status with interactive charts
- **Budget Creation**: Create monthly budgets with categories and limits
- **Expense Tracking**: Add, edit, and delete expenses with category support and recurring expense marking
- **Income Tracking**: Track income sources and amounts
- **Goal Setting**: Set financial goals and track progress
- **Reporting**: Generate financial reports including:
  - Income vs Expenses
  - Budget Variance
  - Savings Progress

## Technologies Used

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Frontend**: HTML, CSS, JavaScript
- **Charts**: Chart.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Installation

1. Make sure you have Node.js installed (version 14 or higher)

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Register**: Create a new account by clicking "Register"
2. **Login**: Log in with your credentials
3. **Dashboard**: View your financial overview
4. **Create Budget**: Set up monthly budgets with categories
5. **Track Expenses**: Add your expenses and mark recurring ones
6. **Track Income**: Record your income sources
7. **Set Goals**: Create financial goals and track progress
8. **View Reports**: Generate and view financial reports

## Project Structure

```
budget-tracking-website/
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
├── budget.db              # SQLite database (created automatically)
├── public/                # Frontend files
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # Dashboard with charts
│   ├── budgets.html       # Budget management
│   ├── expenses.html      # Expense tracking
│   ├── income.html        # Income tracking
│   ├── goals.html         # Goal setting
│   ├── reports.html       # Financial reports
│   ├── styles.css         # Styling
│   ├── api.js             # API utility functions
│   ├── auth.js            # Authentication handling
│   ├── dashboard.js       # Dashboard functionality
│   ├── budgets.js         # Budget management
│   ├── expenses.js        # Expense management
│   ├── income.js          # Income management
│   ├── goals.js           # Goal management
│   └── reports.js         # Reports functionality
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Budgets
- `POST /api/budgets` - Create a budget
- `GET /api/budgets` - Get all budgets

### Expenses
- `POST /api/expenses` - Add expense
- `GET /api/expenses` - Get expenses (with optional month/year filter)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Income
- `POST /api/income` - Add income
- `GET /api/income` - Get income (with optional month/year filter)
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income

### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals` - Get all goals
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Reports
- `GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get financial reports

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- All API endpoints (except register/login) require authentication
- **Important**: Change the JWT_SECRET in server.js for production use

## Database Schema

The application uses SQLite with the following tables:
- `users` - User accounts
- `budgets` - Monthly budgets
- `budget_categories` - Budget category limits
- `expenses` - Expense records
- `income` - Income records
- `goals` - Financial goals

## Future Enhancements

- Export reports to PDF/CSV
- Email notifications for budget alerts
- Multi-currency support
- Mobile app
- Data backup and restore

## License

This project is created for educational purposes.

