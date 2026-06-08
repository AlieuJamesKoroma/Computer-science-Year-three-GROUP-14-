/**
 * db.js — Local data store for Attendance Management System
 * Uses localStorage for persistence across browser sessions.
 */

const DB_KEY = 'ams_db_v1';

const DEFAULT_DB = {
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
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DB));
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