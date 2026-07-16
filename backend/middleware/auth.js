const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

module.exports = {
    authenticate: async(req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Fetch user from DB to ensure they still exist
            const result = await pool.query('SELECT id, email, role, name, student_id, course, level FROM users WHERE id = $1', [decoded.id]);
            if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
            req.user = result.rows[0];
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
};