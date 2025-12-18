const API_URL = 'https://winteradda.onrender.com/api/auth';

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error-message');

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! Please log in.');
            window.location.href = 'login.html';
        } else {
            errorEl.textContent = data.message || 'Signup failed';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error. Please try again.';
        errorEl.style.display = 'block';
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error-message');

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            errorEl.textContent = data.message || 'Login failed';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Server error. Please try again.';
        errorEl.style.display = 'block';
    }
}

// Update UI based on Auth State
function updateAuthUI() {
    const nav = document.querySelector('nav');
    const user = JSON.parse(localStorage.getItem('user'));

    // Remove existing auth links to prevent duplicates if called multiple times
    const existingAuthLinks = document.querySelectorAll('.auth-link');
    existingAuthLinks.forEach(link => link.remove());

    if (user) {
        // Logged In

        // Admin Link
        if (user.role === 'admin') {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Admin Panel';
            adminLink.className = 'auth-link';
            adminLink.style.color = '#ff0080'; // Highlight admin link
            nav.appendChild(adminLink);
        }

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = `Logout (${user.username})`;
        logoutLink.className = 'auth-link';
        logoutLink.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        };
        nav.appendChild(logoutLink);
    } else {
        // Logged Out
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login';
        loginLink.className = 'auth-link';

        const signupLink = document.createElement('a');
        signupLink.href = 'signup.html';
        signupLink.textContent = 'Signup';
        signupLink.className = 'auth-link';

        nav.appendChild(loginLink);
        nav.appendChild(signupLink);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);
