const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const profileRoutes = require('./routes/profile');
const { authenticate } = require('./middleware/auth');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/courses', authenticate, courseRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/profile', authenticate, profileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));