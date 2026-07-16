-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (includes both lecturers and students)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('lecturer', 'student')),
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) UNIQUE,
  course VARCHAR(100),
  level VARCHAR(20)
);

-- Courses table
CREATE TABLE courses (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20) NOT NULL
);

-- Attendance table
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL REFERENCES users(student_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
  course VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL,
  UNIQUE(student_id, date, course)
);

-- Index for faster queries
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);