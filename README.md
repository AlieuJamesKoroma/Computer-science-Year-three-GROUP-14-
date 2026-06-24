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

## Key Features
- **Role‑Based Access** — Lecturers and students have separate dashboards and permissions.
- **Student Registration** — Students can create their own accounts with email, password, and personal details.
- **Secure Login** — Both lecturers and students log in with email and password. Session persists across reloads.
- **Lecturer Dashboard** — Overview of total students and today's attendance stats, plus recent activity.
- **Student Dashboard** — Personal attendance summary and recent records.
- **Student Management (Lecturer)** — Add, search, and remove students. Adding a student automatically creates a login account (default password: `student123`).
- **Course Management (Lecturer)** — Add and manage courses with academic year.
- **Attendance Tracking (Lecturer)** — Mark Present / Absent / Late per student, per date. Bulk actions (All Present, All Absent, Clear All).
- **My Attendance (Student)** — Students can view and filter their own attendance records by course and date.
- **Reports (Lecturer)** — Attendance percentages, filterable by course, level, and period. Export as CSV or print.
- **Profile Page** — Both roles can view their profile and (for students) see their attendance statistics.
- **Session Restoration** — User session persists across browser reloads.

## How to Run
1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
2. No server or installation required.
3. **Default Lecturer Login:**  
   - Email: `admin@unimak.edu.sl`  
   - Password: `admin123`
4. **Sample Student Logins:**  
   - Email: `9912@unimak.edu.sl` (or any student ID + `@unimak.edu.sl`)  
   - Password: `student123`  
   (Students can also register themselves.)

## Project Structure