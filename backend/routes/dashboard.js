console.log('✅ Dashboard route file loaded!');

const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async(req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const isLecturer = req.user.role === 'lecturer';

        if (isLecturer) {
            // Total students
            const totalStudents = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
            // Today's attendance stats
            const todayAtt = await pool.query(
                `SELECT status, COUNT(*) FROM attendance WHERE date = $1 GROUP BY status`, [today]
            );
            const counts = { Present: 0, Absent: 0, Late: 0 };
            todayAtt.rows.forEach(row => counts[row.status] = parseInt(row.count));
            // Recent activity
            const recent = await pool.query(
                `SELECT a.*, u.name as student_name
         FROM attendance a
         JOIN users u ON a.student_id = u.student_id
         ORDER BY a.date DESC, a.id DESC
         LIMIT 20`
            );
            res.json({
                totalStudents: parseInt(totalStudents.rows[0].count),
                todayStats: counts,
                recent: recent.rows
            });
        } else {
            // Student dashboard: their own stats
            const studentId = req.user.student_id;
            const myRecs = await pool.query(
                `SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC`, [studentId]
            );
            const total = myRecs.rows.length;
            const present = myRecs.rows.filter(r => r.status === 'Present').length;
            const absent = myRecs.rows.filter(r => r.status === 'Absent').length;
            const late = myRecs.rows.filter(r => r.status === 'Late').length;
            res.json({
                total,
                present,
                absent,
                late,
                recent: myRecs.rows.slice(0, 20)
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

module.exports = router;