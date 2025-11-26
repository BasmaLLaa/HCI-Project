// Expenses functionality
let editingExpenseId = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeToken();
            window.location.href = 'index.html';
        });
    }

    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseForm = document.getElementById('expenseForm');
    const expenseFormElement = document.getElementById('expenseFormElement');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');
    const filterMonth = document.getElementById('filterMonth');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

    // Set today's date as default
    document.getElementById('expenseDate').valueAsDate = new Date();

    addExpenseBtn.addEventListener('click', () => {
        editingExpenseId = null;
        document.getElementById('expenseFormTitle').textContent = 'Add Expense';
        expenseForm.style.display = 'block';
        expenseFormElement.reset();
        document.getElementById('expenseDate').valueAsDate = new Date();
    });

    cancelExpenseBtn.addEventListener('click', () => {
        expenseForm.style.display = 'none';
        expenseFormElement.reset();
        editingExpenseId = null;
    });

    expenseFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const expenseData = {
            category: document.getElementById('expenseCategory').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            description: document.getElementById('expenseDescription').value,
            date: document.getElementById('expenseDate').value,
            isRecurring: document.getElementById('expenseRecurring').checked
        };

        try {
            if (editingExpenseId) {
                await expensesAPI.update(editingExpenseId, expenseData);
                alert('Expense updated successfully!');
            } else {
                await expensesAPI.create(expenseData);
                alert('Expense added successfully!');
            }
            expenseForm.style.display = 'none';
            expenseFormElement.reset();
            editingExpenseId = null;
            loadExpenses();
        } catch (error) {
            alert('Error saving expense: ' + error.message);
        }
    });

    filterMonth.addEventListener('change', () => {
        loadExpenses();
    });

    clearFilterBtn.addEventListener('click', () => {
        filterMonth.value = '';
        loadExpenses();
    });

    loadExpenses();
});

async function loadExpenses() {
    try {
        const filterMonth = document.getElementById('filterMonth').value;
        const params = {};
        
        if (filterMonth) {
            const [year, month] = filterMonth.split('-');
            params.year = year;
            params.month = month;
        }

        const expenses = await expensesAPI.getAll(params);
        displayExpenses(expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function displayExpenses(expenses) {
    const expensesList = document.getElementById('expensesList');
    
    if (!expenses || expenses.length === 0) {
        expensesList.innerHTML = '<p>No expenses recorded yet.</p>';
        return;
    }

    expensesList.innerHTML = expenses.map(expense => {
        const date = new Date(expense.date);
        const recurringBadge = expense.is_recurring 
            ? '<span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-left: 0.5rem;">Recurring</span>'
            : '';
        
        return `
            <div class="expense-item">
                <div class="item-info">
                    <h3>${expense.category} ${recurringBadge}</h3>
                    <p><strong>Amount:</strong> ${formatCurrency(expense.amount)}</p>
                    <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
                    ${expense.description ? `<p><strong>Description:</strong> ${expense.description}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editExpense(${expense.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function editExpense(id) {
    try {
        const expenses = await expensesAPI.getAll();
        const expense = expenses.find(e => e.id === id);
        
        if (!expense) {
            alert('Expense not found');
            return;
        }

        editingExpenseId = id;
        document.getElementById('expenseFormTitle').textContent = 'Edit Expense';
        document.getElementById('expenseId').value = id;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseRecurring').checked = expense.is_recurring;
        
        document.getElementById('expenseForm').style.display = 'block';
    } catch (error) {
        alert('Error loading expense: ' + error.message);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        await expensesAPI.delete(id);
        alert('Expense deleted successfully!');
        loadExpenses();
    } catch (error) {
        alert('Error deleting expense: ' + error.message);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

