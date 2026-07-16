const router = require('express').Router();
const pool = require('../db/pool');

// GET all courses
router.get('/', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// POST add course
router.post('/', async(req, res) => {
    const { code, name, year } = req.body;
    if (!code || !name || !year) {
        return res.status(400).json({ error: 'All fields required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO courses (code, name, year) VALUES ($1, $2, $3) RETURNING *', [code, name, year]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // unique violation
            return res.status(400).json({ error: 'Course code already exists' });
        }
        res.status(500).json({ error: 'Failed to add course' });
    }
});

// DELETE course
router.delete('/:code', async(req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('DELETE FROM courses WHERE code = $1 RETURNING *', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

module.exports = router;