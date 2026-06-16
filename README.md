# Student Attendance Management System
**University of Makeni — Computer Science Year 3**
**Group 14 — Web Programming Final Project**

## Group Members
| Name | Student ID |
|---|---|
| Alieu James Koroma | 9912 |
| Alusine Sesay | 12153 |
| Paul Alusine Kargbo | 11241 |
| Samuel Sorie Kargbo | 11240 |
| David H. Samn | 11422 |

---

## Overview
A fully client-side web prototype for managing student attendance in academic institutions. Built with HTML, CSS, and JavaScript. All data persists in the browser's `localStorage`.

## Features
- **Secure Login** — Admin authentication with session persistence
- **Dashboard** — Live stats for today's attendance + recent activity
- **Student Management** — Add, search, and remove students
- **Course Management** — Add and manage courses with academic year
- **Attendance Tracking** — Mark Present / Absent / Late per student, per date
- **Bulk Attendance Actions** — Mark all students as Present/Absent or clear all marks at once
- **Edit Attendance** — Modify or remove past attendance records
- **Reports** — Attendance percentages, filterable by course, level, and period
- **Student Statistics** — View individual student attendance trends
- **Export** — Download attendance data as CSV; print reports
- **Session Restoration** — User session persists across browser reloads

## How to Run
1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
2. No server or installation required.
3. Login with: **username:** `admin` | **password:** `admin123`

## Project Structure
```
attendance_system/
├── index.html          — Main HTML structure
├── css/
│   └── style.css       — All styles
├── js/
│   ├── db.js           — Data layer (localStorage)
│   └── app.js          — Application logic
└── README.md
```

## Technologies Used
- HTML5
- CSS3 (CSS Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- localStorage for data persistence
- Tabler Icons (CDN)
- DM Sans & DM Mono fonts (Google Fonts)

## Default Credentials
| Username | Password |
|---|---|
| admin | admin123 |

---
*Submitted: March 2026*
