// Goals functionality
let editingGoalId = null;

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

    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalForm = document.getElementById('goalForm');
    const goalFormElement = document.getElementById('goalFormElement');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');

    addGoalBtn.addEventListener('click', () => {
        editingGoalId = null;
        document.getElementById('goalFormTitle').textContent = 'Add Financial Goal';
        document.getElementById('currentAmountGroup').style.display = 'none';
        goalForm.style.display = 'block';
        goalFormElement.reset();
    });

    cancelGoalBtn.addEventListener('click', () => {
        goalForm.style.display = 'none';
        goalFormElement.reset();
        editingGoalId = null;
    });

    goalFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const goalData = {
            goalName: document.getElementById('goalName').value,
            targetAmount: parseFloat(document.getElementById('targetAmount').value),
            targetDate: document.getElementById('targetDate').value || null
        };

        try {
            if (editingGoalId) {
                const currentAmount = parseFloat(document.getElementById('currentAmount').value) || 0;
                await goalsAPI.update(editingGoalId, { ...goalData, currentAmount });
                alert('Goal updated successfully!');
            } else {
                await goalsAPI.create(goalData);
                alert('Goal created successfully!');
            }
            goalForm.style.display = 'none';
            goalFormElement.reset();
            editingGoalId = null;
            loadGoals();
        } catch (error) {
            alert('Error saving goal: ' + error.message);
        }
    });

    loadGoals();
});

async function loadGoals() {
    try {
        const goals = await goalsAPI.getAll();
        displayGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

function displayGoals(goals) {
    const goalsList = document.getElementById('goalsList');
    
    if (!goals || goals.length === 0) {
        goalsList.innerHTML = '<p>No goals set yet.</p>';
        return;
    }

    goalsList.innerHTML = goals.map(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No target date';
        
        return `
            <div class="goal-item">
                <div class="item-info" style="flex: 1;">
                    <h3>${goal.goal_name}</h3>
                    <p><strong>Target:</strong> ${formatCurrency(goal.target_amount)}</p>
                    <p><strong>Current:</strong> ${formatCurrency(goal.current_amount)}</p>
                    <p><strong>Target Date:</strong> ${targetDate}</p>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <p style="margin-top: 0.5rem;"><strong>Progress:</strong> ${progress.toFixed(1)}%</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editGoal(${goal.id})">Edit</button>
                    <button class="btn btn-secondary" onclick="updateProgress(${goal.id})">Update Progress</button>
                    <button class="btn btn-danger" onclick="deleteGoal(${goal.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function editGoal(id) {
    try {
        const goals = await goalsAPI.getAll();
        const goal = goals.find(g => g.id === id);
        
        if (!goal) {
            alert('Goal not found');
            return;
        }

        editingGoalId = id;
        document.getElementById('goalFormTitle').textContent = 'Edit Financial Goal';
        document.getElementById('goalId').value = id;
        document.getElementById('goalName').value = goal.goal_name;
        document.getElementById('targetAmount').value = goal.target_amount;
        document.getElementById('targetDate').value = goal.target_date || '';
        document.getElementById('currentAmountGroup').style.display = 'block';
        document.getElementById('currentAmount').value = goal.current_amount;
        
        document.getElementById('goalForm').style.display = 'block';
    } catch (error) {
        alert('Error loading goal: ' + error.message);
    }
}

async function updateProgress(id) {
    const newAmount = prompt('Enter amount to add:');
    if (newAmount === null) return;

    const amountToAdd = parseFloat(newAmount);
    if (isNaN(amountToAdd) || amountToAdd < 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        // Get the current goal to fetch existing amount
        const goals = await goalsAPI.getAll();
        const goal = goals.find(g => g.id === id);
        
        if (!goal) {
            alert('Goal not found');
            return;
        }

        // Add new amount to existing amount
        const newTotalAmount = goal.current_amount + amountToAdd;
        console.log('Current amount:', goal.current_amount, 'Adding:', amountToAdd, 'New total:', newTotalAmount);

        const result = await goalsAPI.update(id, { currentAmount: newTotalAmount });
        console.log('Update result:', result);
        alert(`Progress updated! Added $${amountToAdd.toFixed(2)} to reach $${newTotalAmount.toFixed(2)}`);
        // Ensure form is properly closed and state is reset
        document.getElementById('goalForm').style.display = 'none';
        document.getElementById('goalFormElement').reset();
        editingGoalId = null;
        // Wait a moment then reload to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        loadGoals();
    } catch (error) {
        console.error('Update error:', error);
        alert('Error updating progress: ' + error.message);
    }
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) {
        return;
    }

    try {
        await goalsAPI.delete(id);
        alert('Goal deleted successfully!');
        loadGoals();
    } catch (error) {
        alert('Error deleting goal: ' + error.message);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

