const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Student registration
router.post('/register', async(req, res) => {
    const { name, email, password, studentId, course, level } = req.body;
    if (!name || !email || !password || !studentId || !course || !level) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR student_id = $2', [email, studentId]);
        if (existing.rows.length) {
            return res.status(400).json({ error: 'Email or Student ID already registered' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, name, student_id, course, level)
       VALUES ($1, $2, 'student', $3, $4, $5, $6)
       RETURNING id, email, role, name, student_id, course, level`, [email, hashed, name, studentId, course, level]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (for both lecturer and student)
router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        // Remove password_hash from response
        delete user.password_hash;
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;