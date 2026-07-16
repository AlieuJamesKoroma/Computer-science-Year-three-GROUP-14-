const fs = require('fs');
const path = require('path');
const pool = require('./db/pool');

async function runSchema() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
        console.log('📄 Applying schema...');
        await pool.query(sql);
        console.log('✅ Schema applied successfully!');
    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
    } finally {
        pool.end();
    }
}

runSchema();