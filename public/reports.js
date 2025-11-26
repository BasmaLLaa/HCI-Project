// Reports functionality
let incomeVsExpensesChart;

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

    // Set default date range (last 6 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    document.getElementById('endDate').valueAsDate = endDate;
    document.getElementById('startDate').valueAsDate = startDate;

    const generateReportBtn = document.getElementById('generateReportBtn');
    generateReportBtn.addEventListener('click', () => {
        loadReports();
    });

    // Load reports on page load
    loadReports();
});

async function loadReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    try {
        const reports = await reportsAPI.getReports(startDate, endDate);
        displayReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Error loading reports: ' + error.message);
    }
}

function displayReports(reports) {
    // Income vs Expenses Chart
    createIncomeVsExpensesChart(reports.incomeVsExpenses);

    // Budget Variance Table
    displayBudgetVariance(reports.budgetVariance);

    // Savings Progress Table
    displaySavingsProgress(reports.savingsProgress);
}

function createIncomeVsExpensesChart(data) {
    const ctx = document.getElementById('incomeVsExpensesChart');
    if (!ctx) return;

    if (incomeVsExpensesChart) {
        incomeVsExpensesChart.destroy();
    }

    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<p>No data available for the selected period</p>';
        return;
    }

    incomeVsExpensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [
                {
                    label: 'Income',
                    data: data.map(d => d.income),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: data.map(d => d.expenses),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }
            ]
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

function displayBudgetVariance(data) {
    const tableContainer = document.getElementById('budgetVarianceTable');
    
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>No budget data available for the selected period</p>';
        return;
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    let html = '<table><thead><tr><th>Month</th><th>Budget</th><th>Actual Expenses</th><th>Variance</th></tr></thead><tbody>';
    
    data.forEach(item => {
        const varianceColor = item.variance >= 0 ? '#28a745' : '#dc3545';
        html += `
            <tr>
                <td>${monthNames[item.month - 1]} ${item.year}</td>
                <td>${formatCurrency(item.total_budget)}</td>
                <td>${formatCurrency(item.actual_expenses)}</td>
                <td style="color: ${varianceColor}">${formatCurrency(item.variance)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

function displaySavingsProgress(data) {
    const tableContainer = document.getElementById('savingsProgressTable');
    
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>No savings goals available</p>';
        return;
    }

    let html = '<table><thead><tr><th>Goal</th><th>Target Amount</th><th>Current Amount</th><th>Progress</th></tr></thead><tbody>';
    
    data.forEach(item => {
        html += `
            <tr>
                <td>${item.goal_name}</td>
                <td>${formatCurrency(item.target_amount)}</td>
                <td>${formatCurrency(item.current_amount)}</td>
                <td>${item.progress_percentage.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

