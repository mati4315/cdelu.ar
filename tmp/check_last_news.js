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

        const [rows] = await conn.query('SELECT * FROM news ORDER BY id DESC LIMIT 1');
        console.log('--- ULTIMA NOTICIA CREADA ---');
        console.log(JSON.stringify(rows[0], null, 2));

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
