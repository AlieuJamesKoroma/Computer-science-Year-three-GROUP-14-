const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const pool = require('./db/pool');

// First, ensure the database exists
async function ensureDatabase() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: 'postgres', // connect to default 'postgres' DB to create our DB
    };
    const client = new Client(config);
    try {
        await client.connect();
        const dbName = process.env.DB_NAME || 'attendance_db';
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
        if (res.rows.length === 0) {
            console.log(`📦 Creating database "${dbName}"...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created.`);
        } else {
            console.log(`✅ Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('❌ Database creation error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Then run the schema
async function runSchema() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
        console.log('📄 Applying schema...');
        await pool.query(sql);
        console.log('✅ Schema applied successfully.');
    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
    } finally {
        await pool.end();
    }
}

(async() => {
    await ensureDatabase();
    await runSchema();
})();