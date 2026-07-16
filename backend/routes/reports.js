const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async(req, res) => {
    const { course, level, period } = req.query;
    try {
        // Build base query
        let sql = `
      SELECT
        u.student_id,
        u.name,
        u.course,
        u.level,
        COUNT(a.id) AS total,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late
      FROM users u
      LEFT JOIN attendance a ON u.student_id = a.student_id
      WHERE u.role = 'student'
    `;
        const params = [];
        if (course) {
            params.push(course);
            sql += ` AND u.course = $${params.length}`;
        }
        if (level) {
            params.push(level);
            sql += ` AND u.level = $${params.length}`;
        }
        if (period === 'today') {
            params.push(new Date().toISOString().split('T')[0]);
            sql += ` AND a.date = $${params.length}`;
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            params.push(weekAgo.toISOString().split('T')[0]);
            sql += ` AND a.date >= $${params.length}`;
        } else if (period === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            params.push(monthAgo.toISOString().split('T')[0]);
            sql += ` AND a.date >= $${params.length}`;
        }
        sql += ` GROUP BY u.student_id, u.name, u.course, u.level
             ORDER BY u.name`;

        const result = await pool.query(sql, params);
        // Calculate percentage
        const data = result.rows.map(row => ({
            ...row,
            percentage: row.total ? Math.round((row.present / row.total) * 100) : 0
        }));
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;