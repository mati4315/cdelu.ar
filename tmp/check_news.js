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

        console.log('--- Ultimas 10 noticias (JSON) ---');
        const [rows] = await conn.query('SELECT id, titulo, image_url, image_thumbnail_url FROM news ORDER BY id DESC LIMIT 10');
        rows.forEach(r => {
            console.log(`ID: ${r.id} | Titulo: ${r.titulo.substring(0, 30)}... | Image: ${r.image_url} | Thumb: ${r.image_thumbnail_url}`);
        });

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
