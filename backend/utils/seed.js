require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function seed() {
    console.log('\n🔐 Create a lecturer account (admin)\n');

    const email = await new Promise(resolve => rl.question('Email: ', resolve));
    const password = await new Promise(resolve => rl.question('Password: ', resolve));
    const name = await new Promise(resolve => rl.question('Full Name: ', resolve));

    if (!email || !password || !name) {
        console.log('❌ All fields are required.');
        rl.close();
        return;
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, 'lecturer', $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`, [email, hashed, name]
        );

        if (result.rows.length === 0) {
            console.log('⚠️  User with this email already exists.');
        } else {
            console.log(`✅ Lecturer account created: ${email}`);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        rl.close();
        pool.end();
    }
}

seed();