const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await conn.query('SHOW CREATE TRIGGER after_news_insert');
        const statement = rows[0]['SQL Original Statement'] || rows[0]['Statement'];
        fs.writeFileSync(path.join(__dirname, 'trigger_code.txt'), statement);
        console.log('--- TRIGGER CODE SAVED to trigger_code.txt ---');

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
