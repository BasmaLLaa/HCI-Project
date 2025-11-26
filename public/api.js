// API utility functions
const API_BASE_URL = 'http://localhost:3000/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
}

// Make API request
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Auth API
const authAPI = {
    register: (userData) => apiRequest('/register', {
        method: 'POST',
        body: userData
    }),
    login: (credentials) => apiRequest('/login', {
        method: 'POST',
        body: credentials
    })
};

// Dashboard API
const dashboardAPI = {
    getData: () => apiRequest('/dashboard')
};

// Budgets API
const budgetsAPI = {
    create: (budgetData) => apiRequest('/budgets', {
        method: 'POST',
        body: budgetData
    }),
    getAll: () => apiRequest('/budgets')
};

// Expenses API
const expensesAPI = {
    create: (expenseData) => apiRequest('/expenses', {
        method: 'POST',
        body: expenseData
    }),
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/expenses${queryString ? `?${queryString}` : ''}`);
    },
    update: (id, expenseData) => apiRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: expenseData
    }),
    delete: (id) => apiRequest(`/expenses/${id}`, {
        method: 'DELETE'
    })
};

// Income API
const incomeAPI = {
    create: (incomeData) => apiRequest('/income', {
        method: 'POST',
        body: incomeData
    }),
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/income${queryString ? `?${queryString}` : ''}`);
    },
    update: (id, incomeData) => apiRequest(`/income/${id}`, {
        method: 'PUT',
        body: incomeData
    }),
    delete: (id) => apiRequest(`/income/${id}`, {
        method: 'DELETE'
    })
};

// Goals API
const goalsAPI = {
    create: (goalData) => apiRequest('/goals', {
        method: 'POST',
        body: goalData
    }),
    getAll: () => apiRequest('/goals'),
    update: (id, goalData) => apiRequest(`/goals/${id}`, {
        method: 'PUT',
        body: goalData
    }),
    delete: (id) => apiRequest(`/goals/${id}`, {
        method: 'DELETE'
    })
};

// Reports API
const reportsAPI = {
    getReports: (startDate, endDate) => apiRequest(`/reports?startDate=${startDate}&endDate=${endDate}`)
};

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

