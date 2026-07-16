const router = require('express').Router();
const pool = require('../db/pool');

// GET attendance with filters (date, course, level)
router.get('/', async(req, res) => {
    const { date, course, level } = req.query;
    try {
        let query = `
      SELECT a.*, u.name as student_name
      FROM attendance a
      JOIN users u ON a.student_id = u.student_id
      WHERE 1=1
    `;
        const params = [];
        if (date) {
            params.push(date);
            query += ` AND a.date = $${params.length}`;
        }
        if (course) {
            params.push(course);
            query += ` AND a.course = $${params.length}`;
        }
        if (level) {
            params.push(level);
            query += ` AND a.level = $${params.length}`;
        }
        query += ' ORDER BY a.date DESC, u.name';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// POST save attendance (bulk upsert)
router.post('/', async(req, res) => {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'No records provided' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let count = 0;
        for (const rec of records) {
            const { studentId, date, status, course, level } = rec;
            if (!studentId || !date || !status || !course || !level) continue;
            // Upsert: ON CONFLICT (student_id, date, course) DO UPDATE
            const result = await client.query(
                `INSERT INTO attendance (student_id, date, status, course, level)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, date, course)
         DO UPDATE SET status = EXCLUDED.status
         RETURNING *`, [studentId, date, status, course, level]
            );
            if (result.rows.length) count++;
        }
        await client.query('COMMIT');
        res.json({ saved: count });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to save attendance' });
    } finally {
        client.release();
    }
});

// GET attendance for a specific student (used in "My Attendance")
router.get('/student/:id', async(req, res) => {
    const { id } = req.params;
    // Ensure the requesting user is either that student or a lecturer
    if (req.user.role === 'student' && req.user.student_id !== id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC', [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch student attendance' });
    }
});

module.exports = router;