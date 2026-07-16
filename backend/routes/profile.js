const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async(req, res) => {
    const user = req.user; // from auth middleware
    // If student, also fetch attendance stats
    let stats = null;
    if (user.role === 'student' && user.student_id) {
        const result = await pool.query(
            `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late
       FROM attendance
       WHERE student_id = $1`, [user.student_id]
        );
        stats = result.rows[0];
    }
    res.json({ user, stats });
});

module.exports = router;