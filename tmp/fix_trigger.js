const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('--- RECREANDO TRIGGER after_news_insert ---');
        
        const sql = `
            DROP TRIGGER IF EXISTS after_news_insert;
            CREATE TRIGGER after_news_insert AFTER INSERT ON news FOR EACH ROW
            BEGIN
              DECLARE user_name_val VARCHAR(100) DEFAULT NULL;

              IF NEW.created_by IS NOT NULL THEN
                SELECT nombre INTO user_name_val 
                FROM users 
                WHERE id = NEW.created_by;
              END IF;

              INSERT INTO content_feed (
                titulo, 
                descripcion, 
                image_url, 
                type, 
                original_id, 
                user_id, 
                user_name,
                published_at,
                created_at,
                updated_at,
                original_url,
                is_oficial,
                video_url
              ) VALUES (
                NEW.titulo,
                NEW.descripcion,
                NEW.image_url,
                1, -- type = 1 para news
                NEW.id,
                NEW.created_by,
                user_name_val,
                NEW.published_at,
                NEW.created_at,
                NEW.updated_at,
                NEW.original_url,
                NEW.is_oficial,
                NULL
              );
            END;
        `;

        await conn.query(sql);
        console.log('✅ Trigger recreado exitosamente (sin el campo resumen)');

        await conn.end();
    } catch (e) {
        console.error('❌ Error al recrear el trigger:', e);
        process.exit(1);
    }
})();
