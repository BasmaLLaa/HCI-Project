// Budgets functionality
let categoryCount = 0;

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

    const createBudgetBtn = document.getElementById('createBudgetBtn');
    const budgetForm = document.getElementById('budgetForm');
    const budgetFormElement = document.getElementById('budgetFormElement');
    const cancelBudgetBtn = document.getElementById('cancelBudgetBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    // Set current month and year as default
    const now = new Date();
    document.getElementById('budgetYear').value = now.getFullYear();
    document.getElementById('budgetMonth').value = now.getMonth() + 1;

    createBudgetBtn.addEventListener('click', () => {
        budgetForm.style.display = 'block';
        categoryCount = 0;
        document.getElementById('categoriesList').innerHTML = '';
    });

    cancelBudgetBtn.addEventListener('click', () => {
        budgetForm.style.display = 'none';
        budgetFormElement.reset();
    });

    addCategoryBtn.addEventListener('click', () => {
        addCategoryField();
    });

    budgetFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categories = [];
        const categoryInputs = document.querySelectorAll('.category-item');
        categoryInputs.forEach(item => {
            const name = item.querySelector('.category-name').value;
            const limit = parseFloat(item.querySelector('.category-limit').value);
            if (name && limit) {
                categories.push({ name, limit });
            }
        });

        const budgetData = {
            month: parseInt(document.getElementById('budgetMonth').value),
            year: parseInt(document.getElementById('budgetYear').value),
            totalBudget: parseFloat(document.getElementById('totalBudget').value),
            categories
        };

        try {
            await budgetsAPI.create(budgetData);
            alert('Budget created successfully!');
            budgetForm.style.display = 'none';
            budgetFormElement.reset();
            loadBudgets();
        } catch (error) {
            alert('Error creating budget: ' + error.message);
        }
    });

    loadBudgets();
});

function addCategoryField() {
    const categoriesList = document.getElementById('categoriesList');
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-item';
    categoryDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <input type="text" class="category-name" placeholder="Category name" required>
            </div>
            <div class="form-group">
                <input type="number" class="category-limit" step="0.01" min="0" placeholder="Limit" required>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.parentElement.remove()">Remove</button>
            </div>
        </div>
    `;
    categoriesList.appendChild(categoryDiv);
}

async function loadBudgets() {
    try {
        const budgets = await budgetsAPI.getAll();
        displayBudgets(budgets);
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

function displayBudgets(budgets) {
    const budgetsList = document.getElementById('budgetsList');
    
    if (!budgets || budgets.length === 0) {
        budgetsList.innerHTML = '<p>No budgets created yet.</p>';
        return;
    }

    budgetsList.innerHTML = budgets.map(budget => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const categoriesHtml = budget.categories && budget.categories.length > 0
            ? budget.categories.map(cat => `<li>${cat.category_name}: ${formatCurrency(cat.limit_amount)}</li>`).join('')
            : '<li>No categories</li>';

        return `
            <div class="budget-item">
                <div class="item-info">
                    <h3>${monthNames[budget.month - 1]} ${budget.year}</h3>
                    <p><strong>Total Budget:</strong> ${formatCurrency(budget.total_budget)}</p>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                        ${categoriesHtml}
                    </ul>
                </div>
            </div>
        `;
    }).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

