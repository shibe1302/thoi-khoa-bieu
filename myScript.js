
// Data structure to store subjects
let subjects = [];

// DOM elements
const addSubjectBtn = document.getElementById('addSubjectBtn');
const subjectModal = document.getElementById('subjectModal');
const viewSubjectModal = document.getElementById('viewSubjectModal');
const subjectForm = document.getElementById('subjectForm');
const closeButtons = document.querySelectorAll('.close');
const saveBtn = document.getElementById('saveBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const openEditBtn = document.getElementById('openEditBtn');
const viewDeleteBtn = document.getElementById('viewDeleteBtn');

// Get form elements
const subjectId = document.getElementById('subjectId');
const subjectName = document.getElementById('subjectName');
const dayOfWeek = document.getElementById('dayOfWeek');
const periodStart = document.getElementById('periodStart');
const periodEnd = document.getElementById('periodEnd');
const teacherName = document.getElementById('teacherName');
const roomLocation = document.getElementById('roomLocation');

// Color mapping for subjects
const colorClasses = [
    'subject-math',
    'subject-biology',
    'subject-physics',
    'subject-chemistry',
    'subject-history',
    'subject-english'
];

// Day name mapping
const dayNames = [
    '',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

// Load subjects from server on page load
window.addEventListener('load', fetchSubjects);

// Event listeners
addSubjectBtn.addEventListener('click', openAddSubjectModal);
closeButtons.forEach(btn => btn.addEventListener('click', closeModals));
subjectForm.addEventListener('submit', saveSubject);
deleteBtn.addEventListener('click', deleteSubject);
openEditBtn.addEventListener('click', openEditSubjectModal);
viewDeleteBtn.addEventListener('click', deleteViewedSubject);

// Add event listeners for period start/end validation
periodStart.addEventListener('change', validatePeriods);
periodEnd.addEventListener('change', validatePeriods);

function validatePeriods() {
    const start = parseInt(periodStart.value);
    const end = parseInt(periodEnd.value);

    // Check if periods span across lunch break
    if ((start <= 5 && end >= 6) || (end <= 5 && start >= 6)) {
        alert("Classes cannot span across the lunch break (from morning to afternoon)");
        periodEnd.value = periodStart.value;
        return false;
    }

    // Ensure end period is not before start period
    if (end < start) {
        alert("End period cannot be before start period");
        periodEnd.value = periodStart.value;
        return false;
    }

    return true;
}

// Fetch subjects from the backend
function fetchSubjects() {
    fetch('/api/subjects')
        .then(response => response.json())
        .then(data => {
            subjects = data;
            renderTimetable();
        })
        .catch(error => {
            console.error('Error fetching subjects:', error);
            // For demonstration, load sample data
            loadSampleData();
        });
}

// Load sample data for demonstration
function loadSampleData() {
    subjects = [
        {
            id: 1,
            name: 'Math',
            day: 1,
            periodStart: 2,
            periodEnd: 4,
            teacher: 'Dr. Smith',
            location: 'Room 101'
        },
        {
            id: 2,
            name: 'Biology',
            day: 3,
            periodStart: 1,
            periodEnd: 1,
            teacher: 'Mrs. Johnson',
            location: 'Lab 3'
        },
        {
            id: 3,
            name: 'Math',
            day: 3,
            periodStart: 7,
            periodEnd: 9,
            teacher: 'Dr. Smith',
            location: 'Room 101'
        },
        {
            id: 4,
            name: 'Biology',
            day: 6,
            periodStart: 3,
            periodEnd: 4,
            teacher: 'Mrs. Johnson',
            location: 'Lab 3'
        }
    ];

    renderTimetable();
}

// Render subjects on the timetable
function renderTimetable() {
    // Clear all cells first
    for (let period = 1; period <= 10; period++) {
        for (let day = 1; day <= 7; day++) {
            const cell = document.getElementById(`cell-${period}-${day}`);
            cell.innerHTML = '';
            cell.rowSpan = 1;
            cell.style.display = '';
        }
    }

    // Add subjects to timetable
    subjects.forEach((subject, index) => {
        const colorIndex = index % colorClasses.length;
        const colorClass = colorClasses[colorIndex];

        // Only show in first cell of span
        const cell = document.getElementById(`cell-${subject.periodStart}-${subject.day}`);

        // Calculate row span
        const rowSpan = subject.periodEnd - subject.periodStart + 1;

        // Set rowspan attribute
        if (rowSpan > 1) {
            cell.rowSpan = rowSpan;

            // Hide cells that are spanned
            for (let p = subject.periodStart + 1; p <= subject.periodEnd; p++) {
                const hiddenCell = document.getElementById(`cell-${p}-${subject.day}`);
                hiddenCell.style.display = 'none';
            }
        }

        // Create subject element
        const subjectElement = document.createElement('div');
        subjectElement.classList.add('subject', colorClass);
        subjectElement.textContent = subject.name;
        subjectElement.dataset.id = subject.id;

        // Add click event to show subject details
        subjectElement.addEventListener('click', () => showSubjectDetails(subject));

        cell.appendChild(subjectElement);
    });
}

// Open modal to add new subject
function openAddSubjectModal() {
    subjectForm.reset();
    subjectId.value = '';
    document.getElementById('modalTitle').textContent = 'Add New Subject';
    editBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    saveBtn.style.display = 'block';
    subjectModal.style.display = 'flex';
}

// Show subject details when clicked
function showSubjectDetails(subject) {
    document.getElementById('viewSubjectName').textContent = subject.name;
    document.getElementById('viewDay').textContent = dayNames[subject.day];
    document.getElementById('viewPeriods').textContent = `${subject.periodStart} to ${subject.periodEnd}`;
    document.getElementById('viewTeacher').textContent = subject.teacher || 'Not specified';
    document.getElementById('viewLocation').textContent = subject.location || 'Not specified';

    // Store subject ID for edit/delete operations
    viewSubjectModal.dataset.id = subject.id;

    viewSubjectModal.style.display = 'flex';
}

// Open edit modal with subject data
function openEditSubjectModal() {
    const id = viewSubjectModal.dataset.id;
    const subject = subjects.find(s => s.id == id);

    if (!subject) return;

    // Close view modal
    viewSubjectModal.style.display = 'none';

    // Fill form with subject data
    subjectId.value = subject.id;
    subjectName.value = subject.name;
    dayOfWeek.value = subject.day;
    periodStart.value = subject.periodStart;
    periodEnd.value = subject.periodEnd;
    teacherName.value = subject.teacher || '';
    roomLocation.value = subject.location || '';

    // Update modal title and buttons
    document.getElementById('modalTitle').textContent = 'Edit Subject';
    saveBtn.style.display = 'block';
    deleteBtn.style.display = 'block';

    // Show edit modal
    subjectModal.style.display = 'flex';
}

// Save new or edited subject
function saveSubject(e) {
    e.preventDefault();

    if (!validatePeriods()) {
        return;
    }

    const id = subjectId.value ? parseInt(subjectId.value) : Date.now();
    const subject = {
        id: id,
        name: subjectName.value,
        day: parseInt(dayOfWeek.value),
        periodStart: parseInt(periodStart.value),
        periodEnd: parseInt(periodEnd.value),
        teacher: teacherName.value,
        location: roomLocation.value
    };

    // Check for conflicts
    if (hasTimeConflict(subject)) {
        alert('This time slot conflicts with an existing subject!');
        return;
    }

    // Send data to backend
    const url = subjectId.value ? `/api/subjects/${id}` : '/api/subjects';
    const method = subjectId.value ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subject)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);

            // For demo purposes, update local data
            if (subjectId.value) {
                const index = subjects.findIndex(s => s.id == id);
                if (index !== -1) {
                    subjects[index] = subject;
                }
            } else {
                subjects.push(subject);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, update local data anyway
            if (subjectId.value) {
                const index = subjects.findIndex(s => s.id == id);
                if (index !== -1) {
                    subjects[index] = subject;
                }
            } else {
                subjects.push(subject);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        });
}

// Check for time conflicts with existing subjects
function hasTimeConflict(newSubject) {
    return subjects.some(existingSubject => {
        // Skip comparing with itself (for edits)
        if (existingSubject.id == newSubject.id) {
            return false;
        }

        // Check if same day
        if (existingSubject.day !== newSubject.day) {
            return false;
        }

        // Check for period overlap
        return !(
            newSubject.periodEnd < existingSubject.periodStart ||
            newSubject.periodStart > existingSubject.periodEnd
        );
    });
}

// Delete subject
function deleteSubject() {
    const id = subjectId.value;

    if (!id) return;

    if (!confirm('Are you sure you want to delete this subject?')) {
        return;
    }

    fetch(`/api/subjects/${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            console.log('Subject deleted');

            // For demo purposes, update local data
            const index = subjects.findIndex(s => s.id == id);
            if (index !== -1) {
                subjects.splice(index, 1);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, update local data anyway
            const index = subjects.findIndex(s => s.id == id);
            if (index !== -1) {
                subjects.splice(index, 1);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        });
}

// Delete subject from view modal
function deleteViewedSubject() {
    const id = viewSubjectModal.dataset.id;

    if (!id) return;

    if (!confirm('Are you sure you want to delete this subject?')) {
        return;
    }

    fetch(`/api/subjects/${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            console.log('Subject deleted');

            // For demo purposes, update local data
            const index = subjects.findIndex(s => s.id == id);
            if (index !== -1) {
                subjects.splice(index, 1);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        })
        .catch(error => {
            console.error('Error:', error);
            // For demo purposes, update local data anyway
            const index = subjects.findIndex(s => s.id == id);
            if (index !== -1) {
                subjects.splice(index, 1);
            }

            // Close modal and refresh timetable
            closeModals();
            renderTimetable();
        });
}

// Close all modals
function closeModals() {
    subjectModal.style.display = 'none';
    viewSubjectModal.style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', event => {
    if (event.target === subjectModal) {
        subjectModal.style.display = 'none';
    }
    if (event.target === viewSubjectModal) {
        viewSubjectModal.style.display = 'none';
    }
});

// For demo purposes only - connect to actual API in production
console.log('Demo mode: Using local storage instead of server API');
