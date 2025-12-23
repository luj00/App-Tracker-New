// Import Firebase
import { database } from './firebase-config.js';
import { ref, set, push, get } from 'firebase/database';

const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

function showMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Check if already logged in
const currentUser = localStorage.getItem('currentUser');
if (currentUser) {
    window.location.href = 'home.html';
}

// Signup Form
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!username || !password || !confirmPassword) {
        showMessage(errorMsg, 'Please fill in all required fields');
        return;
    }

    if (password.length < 8) {
        showMessage(errorMsg, 'Password must be at least 8 characters');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(errorMsg, 'Passwords do not match');
        return;
    }

    try {
        // Check if username or email already exists
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const userData of Object.values(users)) {
                if (userData.username === username) {
                    showMessage(errorMsg, 'Username already exists');
                    return;
                }
                if (email && userData.email === email) {
                    showMessage(errorMsg, 'Email already registered');
                    return;
                }
            }
        }

        // Create new user
        const newUserRef = push(usersRef);
        await set(newUserRef, {
            username: username,
            email: email || '',
            password: password,
            profilePicture: '',
            createdAt: Date.now()
        });

        // Store user session
        localStorage.setItem('currentUser', newUserRef.key);
        localStorage.setItem('username', username);

        showMessage(successMsg, 'Account created successfully! Redirecting...');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        showMessage(errorMsg, 'Signup failed. Please try again.');
    }
});