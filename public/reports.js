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
    if (generateReportBtn) {
        console.log('Generate Report button found, adding click listener');
        generateReportBtn.addEventListener('click', () => {
            console.log('Generate Report button clicked');
            loadReports();
        });
    } else {
        console.error('Generate Report button not found!');
    }

    // Load reports on page load
    loadReports();
});

async function loadReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    console.log('Loading reports with dates:', { startDate, endDate });

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    try {
        console.log('Calling reportsAPI.getReports...');
        const reports = await reportsAPI.getReports(startDate, endDate);
        console.log('Reports received:', reports);
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
    console.log('createIncomeVsExpensesChart called with data:', data);
    
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }

    if (incomeVsExpensesChart) {
        incomeVsExpensesChart.destroy();
    }

    if (!data || data.length === 0) {
        console.log('No data available, showing message');
        ctx.parentElement.innerHTML = '<p>No data available for the selected period</p>';
        return;
    }

    const labels = data.map(d => d.month);
    const incomeData = data.map(d => Number(d.income) || 0);
    const expensesData = data.map(d => Number(d.expenses) || 0);
    
    console.log('Chart data prepared:', { labels, incomeData, expensesData });

    incomeVsExpensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#28a745'
                },
                {
                    label: 'Expenses',
                    data: expensesData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
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

