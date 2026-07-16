require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- ADD THIS
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const profileRoutes = require('./routes/profile');
const { authenticate } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api', authRoutes);

// Protected routes (require JWT)
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/courses', authenticate, courseRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/profile', authenticate, profileRoutes);

// Dashboard endpoint (protected)
app.use('/api/dashboard', authenticate, require('./routes/dashboard'));

// ============================================================
// SERVE STATIC FRONTEND FILES (ADD THIS SECTION)
// ============================================================

// Serve static files from the project root (where index.html lives)
// If your frontend files are in a 'frontend' folder, change '..' to '../frontend'
app.use(express.static(path.join(__dirname, '..')));

// For any request that does NOT start with /api, send index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));