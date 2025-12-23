// Import Firebase
import { database } from './firebase-config.js';
import { ref, get, set } from 'firebase/database';

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

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showMessage(errorMsg, 'Please fill in all fields');
        return;
    }

    try {
        // Debug: check database connection
        console.log('Attempting to read users from Firebase...');
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        console.log('Snapshot exists:', snapshot.exists());
        console.log('Snapshot value:', snapshot.val());

        if (snapshot.exists()) {
            const users = snapshot.val();
            let userFound = false;
            let userId = null;

            // Search for user by username or email
            for (const [id, userData] of Object.entries(users)) {
                console.log('Checking user:', userData);

                // Normalize casing for comparison
                const dbUsername = userData.username?.toLowerCase();
                const dbEmail = userData.email?.toLowerCase();
                const inputUsername = username.toLowerCase();

                if ((dbUsername === inputUsername || dbEmail === inputUsername) &&
                    userData.password === password) {
                    userFound = true;
                    userId = id;
                    console.log('User matched with ID:', userId);
                    break;
                }
            }

            if (userFound) {
                // Store user session
                localStorage.setItem('currentUser', userId);
                localStorage.setItem('username', users[userId].username);

                showMessage(successMsg, 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                console.warn('Login failed: no matching user');
                showMessage(errorMsg, 'Invalid username/email or password');
            }
        } else {
            console.warn('No users found in database');
            showMessage(errorMsg, 'No users found. Please sign up first.');
        }
    } catch (error) {
        console.error('Firebase read error:', error);
        showMessage(errorMsg, 'Login failed due to a database error.');
    }
});

// Optional: Add a test user for debugging (uncomment to run once)
/*
const testUserRef = ref(database, 'users/testUser');
set(testUserRef, {
    username: 'lujain',
    email: 'lujain@example.com',
    password: '123456'
}).then(() => console.log('Test user created!'))
  .catch(err => console.error('Error creating test user:', err));
*/
