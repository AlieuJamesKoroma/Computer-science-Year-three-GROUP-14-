require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));