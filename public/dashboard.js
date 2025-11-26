// Dashboard functionality
let expensesChart, incomeExpensesChart;

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeToken();
            window.location.href = 'index.html';
        });
    }

    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const data = await dashboardAPI.getData();
        
        // Update stats
        document.getElementById('totalIncome').textContent = formatCurrency(data.totalIncome);
        document.getElementById('totalExpenses').textContent = formatCurrency(data.totalExpenses);
        document.getElementById('balance').textContent = formatCurrency(data.balance);
        document.getElementById('activeGoals').textContent = data.goals.length;

        // Update balance color
        const balanceEl = document.getElementById('balance');
        balanceEl.style.color = data.balance >= 0 ? '#28a745' : '#dc3545';

        // Create expenses by category chart
        createExpensesChart(data.expensesByCategory);

        // Create income vs expenses chart
        createIncomeExpensesChart(data.totalIncome, data.totalExpenses);

        // Display goals
        displayGoals(data.goals);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data');
    }
}

function createExpensesChart(categories) {
    const ctx = document.getElementById('expensesChart');
    if (!ctx) return;

    if (expensesChart) {
        expensesChart.destroy();
    }

    if (!categories || categories.length === 0) {
        ctx.parentElement.innerHTML = '<p>No expenses data available</p>';
        return;
    }

    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.category),
            datasets: [{
                data: categories.map(c => c.total),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#00f2fe',
                    '#43e97b',
                    '#fa709a'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function createIncomeExpensesChart(income, expenses) {
    const ctx = document.getElementById('incomeExpensesChart');
    if (!ctx) return;

    if (incomeExpensesChart) {
        incomeExpensesChart.destroy();
    }

    incomeExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount',
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayGoals(goals) {
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;

    if (!goals || goals.length === 0) {
        goalsList.innerHTML = '<p>No goals set yet. <a href="goals.html">Create a goal</a></p>';
        return;
    }

    goalsList.innerHTML = goals.slice(0, 3).map(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        return `
            <div class="goal-item">
                <div class="item-info">
                    <h3>${goal.goal_name}</h3>
                    <p>${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}</p>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
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

