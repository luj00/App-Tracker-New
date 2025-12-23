// Import Firebase
import { database } from './firebase-config.js';
import { ref, set, push, remove, onValue } from 'firebase/database';

// Select the list and form
const list = document.querySelector('#list ul');
const addForm = document.getElementById('add');
const searchInput = document.querySelector('#search input'); // ADD THIS

// Store reminders data for search
let remindersData = {};

// Load reminders from Firebase on page load
loadReminders();

// Add search functionality
if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderListWithSearch(remindersData);
    });
}

// Add new reminder on form submission
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = addForm.querySelector('input[type="text"]').value.trim();

    if (value === '') {
        alert('Please enter your reminder!');
        return;
    }

    if (value.length > 60) {
        alert('Reminder title is too long! Maximum 60 characters allowed.');
        return;
    }

    try {
        // Create a new reminder in Firebase
        const remindersRef = ref(database, 'reminders');
        const newReminderRef = push(remindersRef);
        
        await set(newReminderRef, {
            name: value,
            isDone: '✖️',
            note: '',
            timestamp: Date.now()
        });

        // Clear the input field
        addForm.querySelector('input[type="text"]').value = '';
    } catch (error) {
        console.error('Error adding reminder:', error);
        alert('Failed to add reminder. Please try again.');
    }
});

// Event listener for handling all interactions with the list
list.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const reminderId = li.dataset.id;

    // Delete button functionality
    if (e.target.className === 'delete') {
        if (confirm('Are you sure you want to delete this reminder?')) {
            try {
                const reminderRef = ref(database, `reminders/${reminderId}`);
                await remove(reminderRef);
            } catch (error) {
                console.error('Error deleting reminder:', error);
                alert('Failed to delete reminder. Please try again.');
            }
        }
    }

    // Done button functionality
    if (e.target.className === 'done') {
        toggleDone(reminderId, li);
    }

    // Note toggle functionality
    if (e.target.className === 'note-toggle') {
        toggleNoteVisibility(li, e.target);
    }
});

// Double-click event listener for editing the reminder text
list.addEventListener('dblclick', (e) => {
    if (e.target.className === 'name') {
        editReminderText(e.target);
    }
});

list.addEventListener('blur', async (e) => {
    if (!e.target.classList.contains('note')) return;
    const listItem = e.target.closest('li');
    const goalId = listItem.dataset.id;
    const noteValue = e.target.value;

    try {
        const goalRef = ref(database, `goals/${goalId}/note`);
        await set(goalRef, noteValue);
        console.log('Note updated:', noteValue);
    } catch (error) {
        console.error('Error updating note:', error);
    }
}, true); // true = use capture so blur works properly


// Function to create a reminder item
function createReminderItem(reminderId, reminderData) {
    const li = document.createElement('li');
    li.dataset.id = reminderId;
    li.dataset.done = reminderData.isDone || '✖️';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = reminderData.name;
    nameSpan.title = "Double-click to edit this title";

    const hintSpan = document.createElement('span');
    hintSpan.className = 'edit-hint';

    li.appendChild(nameSpan);
    li.appendChild(hintSpan);

    // Delete button
    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'delete';
    deleteSpan.textContent = 'Delete';

    // Done button
    const doneSpan = document.createElement('span');
    doneSpan.className = 'done';
    doneSpan.textContent = reminderData.isDone || '✖️';
    doneSpan.style.backgroundColor = 'white';

    // Note toggle button
    const noteToggleSpan = document.createElement('span');
    noteToggleSpan.className = 'note-toggle';
    noteToggleSpan.textContent = 'Add Note';

    // Note textarea
    const noteTextarea = document.createElement('textarea');
    noteTextarea.className = 'note';
    noteTextarea.placeholder = 'Add a note...';
    noteTextarea.value = reminderData.note || '';
    noteTextarea.style.display = 'none';

    // If note has content, show it automatically
    if (reminderData.note) {
        noteTextarea.style.display = 'block';
        noteToggleSpan.textContent = 'Hide Note';
    }

    // Append elements to the list item
    li.appendChild(deleteSpan);
    li.appendChild(doneSpan);
    li.appendChild(noteToggleSpan);
    li.appendChild(noteTextarea);

    return li;
}

// Toggle note visibility
function toggleNoteVisibility(li, noteToggle) {
    const noteTextarea = li.querySelector('.note');
    if (noteTextarea.style.display === 'none') {
        noteTextarea.style.display = 'block';
        noteToggle.textContent = 'Hide Note';
    } else {
        noteTextarea.style.display = 'none';
        noteToggle.textContent = 'Add Note';
    }
}

// Function to load reminders from Firebase
function loadReminders() {
    const remindersRef = ref(database, 'reminders');
    
    // Show loading message
    list.innerHTML = '<li style="text-align: center; color: #999;">Loading reminders...</li>';

    // Check localStorage for cached reminders
    const cachedReminders = localStorage.getItem('reminders');
    if (cachedReminders) {
        try {
            const parsed = JSON.parse(cachedReminders);
            remindersData = parsed;
            // Display cached reminders immediately
            renderAllReminders(remindersData);
        } catch (error) {
            console.error('Error parsing cached reminders:', error);
        }
    }

    // Listen to Firebase updates
    onValue(remindersRef, (snapshot) => {
        remindersData = snapshot.val() || {};
        
        // Save to localStorage for next load
        localStorage.setItem('reminders', JSON.stringify(remindersData));
        
        // If search is active, use filtered view
        if (searchInput && searchInput.value.trim()) {
            renderListWithSearch(remindersData);
        } else {
            // Otherwise show all reminders
            renderAllReminders(remindersData);
        }
    }, (error) => {
        console.error('Error loading reminders:', error);
        list.innerHTML = '<li style="color: red;">Error loading reminders. Please refresh.</li>';
    });
}

// Function to render all reminders
function renderAllReminders(reminders) {
    list.innerHTML = '';
    
    if (!reminders || Object.keys(reminders).length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">No reminders yet. Add your first reminder!</li>';
        return;
    }

    Object.entries(reminders).forEach(([reminderId, reminderData]) => {
        const li = createReminderItem(reminderId, reminderData);
        list.appendChild(li);
    });
}

// Function to render filtered list based on search
function renderListWithSearch(data) {
    const query = searchInput.value.toLowerCase().trim();
    list.innerHTML = '';

    // If no data, show a message
    if (!data || Object.keys(data).length === 0) {
        const noDataMsg = document.createElement('li');
        noDataMsg.textContent = 'No reminders found.';
        noDataMsg.style.textAlign = 'center';
        noDataMsg.style.color = '#999';
        list.appendChild(noDataMsg);
        return;
    }

    let matchCount = 0;

    Object.entries(data).forEach(([id, itemData]) => {
        const name = (itemData.name || '').toLowerCase();
        const note = (itemData.note || '').toLowerCase();

        // Show all items if query is empty, otherwise filter
        if (!query || name.includes(query) || note.includes(query)) {
            const li = createReminderItem(id, itemData);
            list.appendChild(li);
            matchCount++;
        }
    });

    // Show "no results" message if no matches
    if (matchCount === 0 && query) {
        const noResults = document.createElement('li');
        noResults.textContent = `No results found for "${searchInput.value}"`;
        noResults.style.textAlign = 'center';
        noResults.style.color = '#999';
        list.appendChild(noResults);
    }
}

// Function to toggle the done state of a reminder
async function toggleDone(reminderId, li) {
    const currentState = li.dataset.done;
    const nextState = currentState === '✔️' ? '✖️' : '✔️';

    try {
        const reminderRef = ref(database, `reminders/${reminderId}/isDone`);
        await set(reminderRef, nextState);
        
        // Update UI immediately
        li.dataset.done = nextState;
        const doneButton = li.querySelector('.done');
        
        doneButton.textContent = nextState;
        doneButton.style.backgroundColor = 'white';
        doneButton.style.color = 'white';
        
        console.log('New done state:', nextState);
    } catch (error) {
        console.error('Error updating done state:', error);
        alert('Failed to update reminder status. Please try again.');
    }
}

// Edit reminder text
function editReminderText(nameSpan) {
    const listItem = nameSpan.closest('li');
    const reminderId = listItem.dataset.id;
    const currentText = nameSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.maxLength = 60; // Add character limit

    nameSpan.replaceWith(input);
    input.focus();

    input.addEventListener('blur', async () => {
        const newValue = input.value.trim();
        
        if (newValue.length > 60) {
            alert('Reminder title is too long! Maximum 60 characters allowed.');
            nameSpan.textContent = currentText;
            input.replaceWith(nameSpan);
            return;
        }
        
        nameSpan.textContent = newValue || currentText;
        input.replaceWith(nameSpan);

        if (newValue && newValue !== currentText) {
            try {
                const reminderRef = ref(database, `reminders/${reminderId}/name`);
                await set(reminderRef, newValue);
            } catch (error) {
                console.error('Error updating reminder name:', error);
                alert('Failed to update reminder name. Please try again.');
            }
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') input.blur();
    });
}