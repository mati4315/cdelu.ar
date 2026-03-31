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

        console.log('--- CODIGO DEL TRIGGER after_news_insert ---');
        const [rows] = await conn.query('SHOW CREATE TRIGGER after_news_insert');
        if(rows[0] && rows[0].SQLOriginalStatement) {
            console.log(rows[0].SQLOriginalStatement);
        } else if(rows[0] && rows[0].Statement) {
            console.log(rows[0].Statement);
        } else {
            console.log(JSON.stringify(rows[0], null, 2));
        }

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
