// Function to simulate creating a new notebook
function createNewNotebook() {
    const notebookName = prompt("Enter the name of your new notebook:");
    if (notebookName) {
        // Add the new notebook to the list dynamically
        const notebookList = document.querySelector('.notebook-list');
        const newNotebookItem = document.createElement('li');
        newNotebookItem.classList.add('notebook-item');
        newNotebookItem.innerHTML = `
            <div class="notebook-info">
                <span class="notebook-name">${notebookName}</span>
                <button class="action-btn dropdown-btn" onclick="toggleDropdown(event)">⋮</button>
            </div>
            <div class="dropdown-options">
                <button class="action-btn rename-btn" onclick="renameNotebook(event)">Rename</button>
                <button class="action-btn delete-btn" onclick="deleteNotebook(event)">Delete</button>
                <button class="action-btn share-btn" onclick="shareNotebook(event)">Share</button>
            </div>
        `;
        notebookList.appendChild(newNotebookItem);
    }
}

// Function to toggle the visibility of the dropdown options
function toggleDropdown(event) {
    const dropdown = event.target.closest('.notebook-item').querySelector('.dropdown-options');
    const allDropdowns = document.querySelectorAll('.dropdown-options');
    
    // Hide all dropdowns except the one that was clicked
    allDropdowns.forEach(option => {
        if (option !== dropdown) {
            option.classList.remove('active');
        }
    });

    // Toggle the clicked dropdown
    dropdown.classList.toggle('active');
}

// Function to rename a notebook
function renameNotebook(event) {
    const notebookItem = event.target.closest('.notebook-item');
    const notebookName = notebookItem.querySelector('.notebook-name');
    const newName = prompt("Enter a new name for the notebook:", notebookName.textContent);
    if (newName) {
        notebookName.textContent = newName;
    }
    toggleDropdown(event);  // Close the dropdown after renaming
}

// Function to delete a notebook
function deleteNotebook(event) {
    if (confirm("Are you sure you want to delete this notebook?")) {
        const notebookItem = event.target.closest('.notebook-item');
        notebookItem.remove();
    }
    toggleDropdown(event);  // Close the dropdown after deleting
}

// Function to share a notebook (simulated)
function shareNotebook(event) {
    alert("This notebook has been shared!");
    toggleDropdown(event);  // Close the dropdown after sharing
}
