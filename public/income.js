// Income functionality
let editingIncomeId = null;

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

    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const incomeForm = document.getElementById('incomeForm');
    const incomeFormElement = document.getElementById('incomeFormElement');
    const cancelIncomeBtn = document.getElementById('cancelIncomeBtn');
    const filterMonthIncome = document.getElementById('filterMonthIncome');
    const clearFilterIncomeBtn = document.getElementById('clearFilterIncomeBtn');

    // Set today's date as default
    document.getElementById('incomeDate').valueAsDate = new Date();

    addIncomeBtn.addEventListener('click', () => {
        editingIncomeId = null;
        document.getElementById('incomeFormTitle').textContent = 'Add Income';
        incomeForm.style.display = 'block';
        incomeFormElement.reset();
        document.getElementById('incomeDate').valueAsDate = new Date();
    });

    cancelIncomeBtn.addEventListener('click', () => {
        incomeForm.style.display = 'none';
        incomeFormElement.reset();
        editingIncomeId = null;
    });

    incomeFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const incomeData = {
            source: document.getElementById('incomeSource').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            date: document.getElementById('incomeDate').value
        };

        try {
            if (editingIncomeId) {
                await incomeAPI.update(editingIncomeId, incomeData);
                alert('Income updated successfully!');
            } else {
                await incomeAPI.create(incomeData);
                alert('Income added successfully!');
            }
            incomeForm.style.display = 'none';
            incomeFormElement.reset();
            editingIncomeId = null;
            loadIncome();
        } catch (error) {
            alert('Error saving income: ' + error.message);
        }
    });

    filterMonthIncome.addEventListener('change', () => {
        loadIncome();
    });

    clearFilterIncomeBtn.addEventListener('click', () => {
        filterMonthIncome.value = '';
        loadIncome();
    });

    loadIncome();
});

async function loadIncome() {
    try {
        const filterMonth = document.getElementById('filterMonthIncome').value;
        const params = {};
        
        if (filterMonth) {
            const [year, month] = filterMonth.split('-');
            params.year = year;
            params.month = month;
        }

        const income = await incomeAPI.getAll(params);
        displayIncome(income);
    } catch (error) {
        console.error('Error loading income:', error);
    }
}

function displayIncome(income) {
    const incomeList = document.getElementById('incomeList');
    
    if (!income || income.length === 0) {
        incomeList.innerHTML = '<p>No income recorded yet.</p>';
        return;
    }

    incomeList.innerHTML = income.map(item => {
        const date = new Date(item.date);
        
        return `
            <div class="income-item">
                <div class="item-info">
                    <h3>${item.source}</h3>
                    <p><strong>Amount:</strong> ${formatCurrency(item.amount)}</p>
                    <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editIncome(${item.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteIncome(${item.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function editIncome(id) {
    try {
        const incomeList = await incomeAPI.getAll();
        const income = incomeList.find(i => i.id === id);
        
        if (!income) {
            alert('Income not found');
            return;
        }

        editingIncomeId = id;
        document.getElementById('incomeFormTitle').textContent = 'Edit Income';
        document.getElementById('incomeId').value = id;
        document.getElementById('incomeSource').value = income.source;
        document.getElementById('incomeAmount').value = income.amount;
        document.getElementById('incomeDate').value = income.date;
        
        document.getElementById('incomeForm').style.display = 'block';
    } catch (error) {
        alert('Error loading income: ' + error.message);
    }
}

async function deleteIncome(id) {
    if (!confirm('Are you sure you want to delete this income?')) {
        return;
    }

    try {
        await incomeAPI.delete(id);
        alert('Income deleted successfully!');
        loadIncome();
    } catch (error) {
        alert('Error deleting income: ' + error.message);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

