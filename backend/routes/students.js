const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

// GET all students (with optional search)
router.get('/', async(req, res) => {
    const { search = '' } = req.query;
    try {
        const query = `
      SELECT id, email, name, student_id, course, level
      FROM users
      WHERE role = 'student'
        AND (name ILIKE $1 OR student_id ILIKE $1)
      ORDER BY name
    `;
        const result = await pool.query(query, [`%${search}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// POST add a new student (creates a user account with default password 'student123')
router.post('/', async(req, res) => {
    const { studentId, name, course, level } = req.body;
    if (!studentId || !name || !course || !level) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if student already exists
        const existing = await pool.query('SELECT * FROM users WHERE student_id = $1', [studentId]);
        if (existing.rows.length) {
            return res.status(400).json({ error: 'Student ID already exists' });
        }

        const email = `${studentId}@unimak.edu.sl`; // convention
        const password = 'student123'; // default
        const hashed = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, name, student_id, course, level)
       VALUES ($1, $2, 'student', $3, $4, $5, $6)
       RETURNING id, email, name, student_id, course, level`, [email, hashed, name, studentId, course, level]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// DELETE a student (cascades to attendance via foreign key)
router.delete('/:id', async(req, res) => {
    const { id } = req.params;
    try {
        // The attendance table has ON DELETE CASCADE, so we just delete the user
        const result = await pool.query('DELETE FROM users WHERE student_id = $1 AND role = $2 RETURNING *', [id, 'student']);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

module.exports = router;