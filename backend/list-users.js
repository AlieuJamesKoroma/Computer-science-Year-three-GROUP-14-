const pool = require('./db/pool');

async function list() {
    try {
        const res = await pool.query('SELECT id, email, role, name, student_id FROM users');
        if (res.rows.length === 0) {
            console.log('❌ No users found.');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
list();