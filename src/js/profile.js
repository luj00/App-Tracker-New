// Import Firebase
import { database } from './firebase-config.js';
import { ref, set, get } from 'firebase/database';

const successMsg = document.getElementById('successMsg');
const errorMsg = document.getElementById('errorMsg');
const displayUsername = document.getElementById('displayUsername');

// Check if user is logged in
const currentUserId = localStorage.getItem('currentUser');
if (!currentUserId) {
    window.location.href = 'login.html';
}

// Load user data on page load
async function loadUserData() {
    try {
        const userRef = ref(database, `users/${currentUserId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('currentUsername').value = userData.username;
            displayUsername.textContent = userData.username;
            document.getElementById('currentEmail').value = userData.email;
            
            // Load profile picture if exists
            if (userData.profilePicture) {
                document.getElementById('profilePic').src = userData.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Call on page load
loadUserData();

function showMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Username Form
document.getElementById('usernameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('newUsername').value.trim();
    
    if (!newUsername) {
        showMessage(errorMsg, 'Please enter a new username');
        return;
    }

    try {
        // Check if username already exists
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const [id, userData] of Object.entries(users)) {
                if (id !== currentUserId && userData.username === newUsername) {
                    showMessage(errorMsg, 'Username already taken');
                    return;
                }
            }
        }

        const userRef = ref(database, `users/${currentUserId}/username`);
        await set(userRef, newUsername);
        
        document.getElementById('currentUsername').value = newUsername;
        displayUsername.textContent = newUsername;
        localStorage.setItem('username', newUsername);
        document.getElementById('newUsername').value = '';
        
        showMessage(successMsg, 'Username updated successfully!');
    } catch (error) {
        showMessage(errorMsg, 'Failed to update username. Please try again.');
        console.error(error);
    }
});

// Email Form
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEmail = document.getElementById('newEmail').value.trim();
    
    if (!newEmail) {
        showMessage(errorMsg, 'Please enter a new email');
        return;
    }

    try {
        // Check if email already exists
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const [id, userData] of Object.entries(users)) {
                if (id !== currentUserId && userData.email === newEmail) {
                    showMessage(errorMsg, 'Email already registered');
                    return;
                }
            }
        }

        const emailRef = ref(database, `users/${currentUserId}/email`);
        await set(emailRef, newEmail);
        
        document.getElementById('currentEmail').value = newEmail;
        document.getElementById('newEmail').value = '';
        
        showMessage(successMsg, 'Email updated successfully!');
    } catch (error) {
        showMessage(errorMsg, 'Failed to update email. Please try again.');
        console.error(error);
    }
});

// Password Form
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage(errorMsg, 'Please fill all password fields');
        return;
    }

    if (newPassword.length < 8) {
        showMessage(errorMsg, 'Password must be at least 8 characters');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage(errorMsg, 'Passwords do not match');
        return;
    }

    try {
        // Verify current password
        const userRef = ref(database, `users/${currentUserId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.password !== currentPassword) {
                showMessage(errorMsg, 'Current password is incorrect');
                return;
            }
        }

        const passwordRef = ref(database, `users/${currentUserId}/password`);
        await set(passwordRef, newPassword);
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showMessage(successMsg, 'Password updated successfully!');
    } catch (error) {
        showMessage(errorMsg, 'Failed to update password. Please try again.');
        console.error(error);
    }
});

// Profile Picture Upload
const fileInput = document.getElementById('fileInput');
const profilePic = document.getElementById('profilePic');
let selectedFile = null;

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage(errorMsg, 'File size must be less than 5MB');
            return;
        }
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePic.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('uploadBtn').addEventListener('click', async () => {
    if (!selectedFile) {
        showMessage(errorMsg, 'Please select an image first');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageData = e.target.result;
            const pictureRef = ref(database, `users/${currentUserId}/profilePicture`);
            await set(pictureRef, imageData);
            showMessage(successMsg, 'Profile picture updated successfully!');
        };
        reader.readAsDataURL(selectedFile);
    } catch (error) {
        showMessage(errorMsg, 'Failed to upload picture. Please try again.');
        console.error(error);
    }
});

document.getElementById('removeBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to remove your profile picture?')) {
        try {
            profilePic.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23e0d3e6' width='120' height='120'/%3E%3Ctext fill='%236c4584' font-family='Arial' font-size='48' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
            const pictureRef = ref(database, `users/${currentUserId}/profilePicture`);
            await set(pictureRef, '');
            selectedFile = null;
            fileInput.value = '';
            showMessage(successMsg, 'Profile picture removed successfully!');
        } catch (error) {
            showMessage(errorMsg, 'Failed to remove picture. Please try again.');
            console.error(error);
        }
    }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
});