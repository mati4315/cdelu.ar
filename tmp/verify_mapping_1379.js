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

        const [rows] = await conn.query('SELECT id, titulo, image_url, image_thumbnail_url, diario, categoria FROM news WHERE id = 1379');
        const r = rows[0];
        console.log('--- NOTICIA 1379 (Mapeo verificado) ---');
        console.log(`ID: ${r.id}`);
        console.log(`TITULO: ${r.titulo}`);
        console.log(`IMAGE_URL: ${r.image_url}`);
        console.log(`IMAGE_THUMBNAIL_URL: ${r.image_thumbnail_url}`);
        console.log(`DIARIO: ${r.diario}`);
        console.log(`CATEGORIA: ${r.categoria}`);

        await conn.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
