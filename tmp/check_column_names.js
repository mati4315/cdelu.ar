const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await conn.query('SHOW COLUMNS FROM news');
        rows.forEach(r => {
            console.log(`'${r.Field}' | Hex: ${Buffer.from(r.Field).toString('hex')}`);
        });

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
