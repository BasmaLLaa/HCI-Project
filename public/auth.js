// Authentication handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await authAPI.login({ username, password });
                setToken(response.token);
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.add('show');
            }
        });
    }

    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                errorMessage.textContent = 'Passwords do not match';
                errorMessage.classList.add('show');
                return;
            }

            try {
                const response = await authAPI.register({ username, email, password });
                setToken(response.token);
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.add('show');
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeToken();
            window.location.href = 'index.html';
        });
    }

    // Check authentication on protected pages
    if (window.location.pathname !== '/index.html' && 
        window.location.pathname !== '/login.html' && 
        window.location.pathname !== '/register.html' &&
        window.location.pathname !== '/') {
        requireAuth();
    }
});

