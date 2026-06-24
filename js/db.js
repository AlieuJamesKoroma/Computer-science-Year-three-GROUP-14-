/**
 * db.js — Local data store for Attendance Management System
 * Uses localStorage for persistence across browser sessions.
 */

const DB_KEY = 'ams_db_v2'; // version bump for new schema

const DEFAULT_DB = {
    // User accounts: lecturer and students
    users: [{
            email: 'admin@unimak.edu.sl',
            password: 'admin123',
            role: 'lecturer',
            name: 'Lecturer',
            studentId: null,
            course: null,
            level: null
        },
        // Sample student accounts (password: student123)
        {
            email: '9912@unimak.edu.sl',
            password: 'student123',
            role: 'student',
            name: 'Alieu James Koroma',
            studentId: '9912',
            course: 'Computer Science',
            level: 'Year 3'
        },
        {
            email: '12153@unimak.edu.sl',
            password: 'student123',
            role: 'student',
            name: 'Alusine Sesay',
            studentId: '12153',
            course: 'Computer Science',
            level: 'Year 3'
        },
        {
            email: '11241@unimak.edu.sl',
            password: 'student123',
            role: 'student',
            name: 'Paul Alusine Kargbo',
            studentId: '11241',
            course: 'Computer Science',
            level: 'Year 3'
        },
        {
            email: '11240@unimak.edu.sl',
            password: 'student123',
            role: 'student',
            name: 'Samuel Sorie Kargbo',
            studentId: '11240',
            course: 'Computer Science',
            level: 'Year 3'
        },
        {
            email: '11422@unimak.edu.sl',
            password: 'student123',
            role: 'student',
            name: 'David H. Samn',
            studentId: '11422',
            course: 'Computer Science',
            level: 'Year 3'
        }
    ],
    students: [
        { id: '9912', name: 'Alieu James Koroma', course: 'Computer Science', level: 'Year 3' },
        { id: '12153', name: 'Alusine Sesay', course: 'Computer Science', level: 'Year 3' },
        { id: '11241', name: 'Paul Alusine Kargbo', course: 'Computer Science', level: 'Year 3' },
        { id: '11240', name: 'Samuel Sorie Kargbo', course: 'Computer Science', level: 'Year 3' },
        { id: '11422', name: 'David H. Samn', course: 'Computer Science', level: 'Year 3' },
    ],
    courses: [
        { code: 'CS301', name: 'Web Programming', year: '2025/2026' },
        { code: 'CS302', name: 'Database Systems', year: '2025/2026' },
        { code: 'CS303', name: 'Software Engineering', year: '2025/2026' },
    ],
    attendance: [],
};

let db = loadDB();

function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Ensure users array exists (migration)
            if (!parsed.users) parsed.users = DEFAULT_DB.users;
            return parsed;
        }
        return JSON.parse(JSON.stringify(DEFAULT_DB));
    } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
}

function saveDB() {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error('Could not save to localStorage', e);
    }
}

// Helper to find a user by email
function findUser(email) {
    return db.users.find(u => u.email === email);
}

// Helper to add a new user (student or lecturer)
function addUser(email, password, role, name, studentId, course, level) {
    if (findUser(email)) return false;
    db.users.push({ email, password, role, name, studentId, course, level });
    saveDB();
    return true;
}