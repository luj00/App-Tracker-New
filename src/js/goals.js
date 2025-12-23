// Import Firebase
import { database } from './firebase-config.js';
import { ref, set, push, remove, onValue } from 'firebase/database';

// Select the goal list and form
const list = document.querySelector('#list ul');
const addForm = document.getElementById('add');
const searchInput = document.querySelector('#search input'); // For search functionality

// Store goals data for search
let goalsData = {};

// Load goals from Firebase on page load
loadGoals();

// Add search functionality
if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderListWithSearch(goalsData);
    });
}

// Add new goal on form submission
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = addForm.querySelector('input[type="text"]').value.trim();

    if (value === '') {
        alert('Please enter your goal!');
        return;
    }

    if (value.length > 60) {
        alert('Goal title is too long! Maximum 60 characters allowed.');
        return;
    }

    try {
        const goalsRef = ref(database, 'goals');
        const newGoalRef = push(goalsRef);

        await set(newGoalRef, {
            name: value,
            isDone: 'pending',
            note: '',
            timestamp: Date.now()
        });

        addForm.querySelector('input[type="text"]').value = '';
    } catch (error) {
        console.error('Error adding goal:', error);
        alert('Failed to add goal. Please try again.');
    }
});

// Handle list interactions
list.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const goalId = li.dataset.id;

    // Delete
    if (e.target.className === 'delete') {
        if (confirm('Are you sure you want to delete this goal?')) {
            try {
                const goalRef = ref(database, `goals/${goalId}`);
                await remove(goalRef);
            } catch (error) {
                console.error('Error deleting goal:', error);
                alert('Failed to delete goal. Please try again.');
            }
        }
    }

    // Toggle done
    if (e.target.className === 'done') {
        toggleDone(goalId, li);
    }

    // Toggle note visibility
    if (e.target.className === 'note-toggle') {
        toggleNoteVisibility(li, e.target);
    }
});

// Edit goal text on double-click
list.addEventListener('dblclick', (e) => {
    if (e.target.className === 'name') {
        editGoalText(e.target);
    }
});

// Save note on blur
list.addEventListener('blur', async (e) => {
    if (!e.target.classList.contains('note')) return;
    const listItem = e.target.closest('li');
    const goalId = listItem.dataset.id;
    const noteValue = e.target.value;

    try {
        const goalRef = ref(database, `goals/${goalId}/note`);
        await set(goalRef, noteValue);
    } catch (error) {
        console.error('Error updating note:', error);
    }
}, true);

// Create goal item
function createGoalItem(goalId, goalData) {
    const li = document.createElement('li');
    li.dataset.id = goalId;
    li.dataset.done = goalData.isDone || 'pending';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = goalData.name;
    nameSpan.title = "Double-click to edit this title";

    const hintSpan = document.createElement('span');
    hintSpan.className = 'edit-hint';

    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'delete';
    deleteSpan.textContent = 'Delete';

    const doneSpan = document.createElement('span');
    doneSpan.className = 'done';
    doneSpan.textContent = goalData.isDone === 'achieved' ? '✔️' : '⏳';
    doneSpan.style.backgroundColor = 'white';

    const noteToggleSpan = document.createElement('span');
    noteToggleSpan.className = 'note-toggle';
    noteToggleSpan.textContent = 'Add Note';

    const noteTextarea = document.createElement('textarea');
    noteTextarea.className = 'note';
    noteTextarea.placeholder = 'Add a note...';
    noteTextarea.value = goalData.note || '';
    noteTextarea.style.display = 'none';

    if (goalData.note) {
        noteTextarea.style.display = 'block';
        noteToggleSpan.textContent = 'Hide Note';
    }

    li.appendChild(nameSpan);
    li.appendChild(hintSpan);
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

// Load goals
function loadGoals() {
    const goalsRef = ref(database, 'goals');

    list.innerHTML = '<li style="text-align: center; color: #999;">Loading goals...</li>';

    const cachedGoals = localStorage.getItem('goals');
    if (cachedGoals) {
        try {
            goalsData = JSON.parse(cachedGoals);
            renderAllGoals(goalsData);
        } catch (error) {
            console.error('Error parsing cached goals:', error);
        }
    }

    onValue(goalsRef, (snapshot) => {
        goalsData = snapshot.val() || {};
        localStorage.setItem('goals', JSON.stringify(goalsData));

        if (searchInput && searchInput.value.trim()) {
            renderListWithSearch(goalsData);
        } else {
            renderAllGoals(goalsData);
        }
    }, (error) => {
        console.error('Error loading goals:', error);
        list.innerHTML = '<li style="color: red;">Error loading goals. Please refresh.</li>';
    });
}

// Render all goals
function renderAllGoals(goals) {
    list.innerHTML = '';
    if (!goals || Object.keys(goals).length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">No goals yet. Add your first goal!</li>';
        return;
    }
    Object.entries(goals).forEach(([goalId, goalData]) => {
        list.appendChild(createGoalItem(goalId, goalData));
    });
}

// Render filtered list
function renderListWithSearch(data) {
    const query = searchInput.value.toLowerCase().trim();
    list.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
        const noDataMsg = document.createElement('li');
        noDataMsg.textContent = 'No goals found.';
        noDataMsg.style.textAlign = 'center';
        noDataMsg.style.color = '#999';
        list.appendChild(noDataMsg);
        return;
    }

    let matchCount = 0;

    Object.entries(data).forEach(([id, itemData]) => {
        const name = (itemData.name || '').toLowerCase();
        const note = (itemData.note || '').toLowerCase();
        if (!query || name.includes(query) || note.includes(query)) {
            list.appendChild(createGoalItem(id, itemData));
            matchCount++;
        }
    });

    if (matchCount === 0 && query) {
        const noResults = document.createElement('li');
        noResults.textContent = `No results found for "${searchInput.value}"`;
        noResults.style.textAlign = 'center';
        noResults.style.color = '#999';
        list.appendChild(noResults);
    }
}

// Toggle done
async function toggleDone(goalId, li) {
    const currentState = li.dataset.done;
    const nextState = currentState === 'achieved' ? 'pending' : 'achieved';

    try {
        const goalRef = ref(database, `goals/${goalId}/isDone`);
        await set(goalRef, nextState);

        li.dataset.done = nextState;
        const doneButton = li.querySelector('.done');
        doneButton.textContent = nextState === 'achieved' ? '✔️' : '⏳';
        doneButton.style.backgroundColor = 'white';
    } catch (error) {
        console.error('Error updating done state:', error);
        alert('Failed to update goal status. Please try again.');
    }
}

// Edit goal text
function editGoalText(nameSpan) {
    const listItem = nameSpan.closest('li');
    const goalId = listItem.dataset.id;
    const currentText = nameSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.maxLength = 60; // Character limit

    nameSpan.replaceWith(input);
    input.focus();

    // Enforce limit while typing
    input.addEventListener('input', () => {
        if (input.value.length > 60) input.value = input.value.slice(0, 60);
    });

    input.addEventListener('blur', async () => {
        const newValue = input.value.trim() || currentText;
        nameSpan.textContent = newValue;
        nameSpan.className = 'name';
        input.replaceWith(nameSpan);

        if (newValue !== currentText) {
            try {
                const goalRef = ref(database, `goals/${goalId}/name`);
                await set(goalRef, newValue);
            } catch (error) {
                console.error('Error updating goal name:', error);
                alert('Failed to update goal name. Please try again.');
            }
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') input.blur();
    });
}
