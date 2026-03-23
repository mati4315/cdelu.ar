const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './env.local' });

async function setupDatabaseSimpleFeed() {
    console.log('🚀 Configuración Simple del Sistema de Feed Unificado');
    console.log('📂 Base de datos: trigamer_diario');
    
    let connection;
    
    try {
        // 1. Conectar y crear base de datos
        console.log('📝 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        console.log('✅ Conectado a MySQL');
        
        // 2. Crear base de datos
        await connection.execute('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base de datos trigamer_diario creada');
        
        // 3. Cerrar y reconectar con la base de datos
        await connection.end();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'trigamer_diario',
            multipleStatements: true
        });
        console.log('✅ Conectado a trigamer_diario');
        
        // 4. Limpiar tablas existentes
        console.log('🧹 Limpiando base de datos...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        const [tables] = await connection.execute('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        }
        
        const [triggers] = await connection.execute('SHOW TRIGGERS');
        for (const trigger of triggers) {
            await connection.execute(`DROP TRIGGER IF EXISTS ${trigger.Trigger}`);
        }
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Base de datos limpia');
        
        // 5. Ejecutar crear_tablas_minimo.sql
        console.log('\n📝 Paso 1: Creando estructura de tablas...');
        const sqlTablas = fs.readFileSync(path.join(__dirname, 'base de datos', 'crear_tablas_minimo.sql'), 'utf8');
        await connection.execute(sqlTablas);
        console.log('✅ Tablas creadas exitosamente');
        
        // 6. Verificar tablas creadas
        const [tablasCreadas] = await connection.execute('SHOW TABLES');
        console.log(`   📊 ${tablasCreadas.length} tablas creadas:`);
        tablasCreadas.forEach(tabla => {
            console.log(`      - ${Object.values(tabla)[0]}`);
        });
        
        // 7. Ejecutar triggers (manualmente por problemas de delimitador)
        console.log('\n📝 Paso 2: Creando triggers...');
        
        const triggersSQL = [
            // Trigger para insertar news
            `CREATE TRIGGER after_news_insert
            AFTER INSERT ON news
            FOR EACH ROW
            INSERT INTO content_feed (
                titulo, descripcion, image_url, type, original_id, user_id, user_name, 
                published_at, resumen, original_url, is_oficial, video_url, likes_count, comments_count
            ) VALUES (
                NEW.titulo, NEW.descripcion, NEW.image_url, 1, NEW.id, NEW.created_by,
                (SELECT nombre FROM users WHERE id = NEW.created_by),
                COALESCE(NEW.published_at, NEW.created_at), NEW.resumen, NEW.original_url, 
                NEW.is_oficial, NULL, 0, 0
            )`,
            
            // Trigger para actualizar news
            `CREATE TRIGGER after_news_update
            AFTER UPDATE ON news
            FOR EACH ROW
            UPDATE content_feed SET
                titulo = NEW.titulo, descripcion = NEW.descripcion, image_url = NEW.image_url,
                published_at = COALESCE(NEW.published_at, NEW.created_at), resumen = NEW.resumen,
                original_url = NEW.original_url, is_oficial = NEW.is_oficial, updated_at = NOW()
            WHERE type = 1 AND original_id = NEW.id`,
            
            // Trigger para eliminar news
            `CREATE TRIGGER after_news_delete
            AFTER DELETE ON news
            FOR EACH ROW
            DELETE FROM content_feed WHERE type = 1 AND original_id = OLD.id`,
            
            // Trigger para insertar com
            `CREATE TRIGGER after_com_insert
            AFTER INSERT ON com
            FOR EACH ROW
            INSERT INTO content_feed (
                titulo, descripcion, image_url, type, original_id, user_id, user_name,
                published_at, resumen, original_url, is_oficial, video_url, likes_count, comments_count
            ) VALUES (
                NEW.titulo, NEW.descripcion, NEW.image_url, 2, NEW.id, NEW.user_id,
                (SELECT nombre FROM users WHERE id = NEW.user_id),
                NEW.created_at, NULL, NULL, NULL, NEW.video_url, 0, 0
            )`,
            
            // Trigger para actualizar com
            `CREATE TRIGGER after_com_update
            AFTER UPDATE ON com
            FOR EACH ROW
            UPDATE content_feed SET
                titulo = NEW.titulo, descripcion = NEW.descripcion, 
                image_url = NEW.image_url, video_url = NEW.video_url, updated_at = NOW()
            WHERE type = 2 AND original_id = NEW.id`,
            
            // Trigger para eliminar com
            `CREATE TRIGGER after_com_delete
            AFTER DELETE ON com
            FOR EACH ROW
            DELETE FROM content_feed WHERE type = 2 AND original_id = OLD.id`,
            
            // Triggers para likes
            `CREATE TRIGGER after_likes_insert
            AFTER INSERT ON likes
            FOR EACH ROW
            UPDATE content_feed SET likes_count = likes_count + 1, updated_at = NOW()
            WHERE type = 1 AND original_id = NEW.news_id`,
            
            `CREATE TRIGGER after_likes_delete
            AFTER DELETE ON likes
            FOR EACH ROW
            UPDATE content_feed SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW()
            WHERE type = 1 AND original_id = OLD.news_id`,
            
            // Triggers para com_likes
            `CREATE TRIGGER after_com_likes_insert
            AFTER INSERT ON com_likes
            FOR EACH ROW
            UPDATE content_feed SET likes_count = likes_count + 1, updated_at = NOW()
            WHERE type = 2 AND original_id = NEW.com_id`,
            
            `CREATE TRIGGER after_com_likes_delete
            AFTER DELETE ON com_likes
            FOR EACH ROW
            UPDATE content_feed SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW()
            WHERE type = 2 AND original_id = OLD.com_id`,
            
            // Triggers para comments
            `CREATE TRIGGER after_comments_insert
            AFTER INSERT ON comments
            FOR EACH ROW
            UPDATE content_feed SET comments_count = comments_count + 1, updated_at = NOW()
            WHERE type = 1 AND original_id = NEW.news_id`,
            
            `CREATE TRIGGER after_comments_delete
            AFTER DELETE ON comments
            FOR EACH ROW
            UPDATE content_feed SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
            WHERE type = 1 AND original_id = OLD.news_id`,
            
            // Triggers para com_comments
            `CREATE TRIGGER after_com_comments_insert
            AFTER INSERT ON com_comments
            FOR EACH ROW
            UPDATE content_feed SET comments_count = comments_count + 1, updated_at = NOW()
            WHERE type = 2 AND original_id = NEW.com_id`,
            
            `CREATE TRIGGER after_com_comments_delete
            AFTER DELETE ON com_comments
            FOR EACH ROW
            UPDATE content_feed SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
            WHERE type = 2 AND original_id = OLD.com_id`
        ];
        
        for (let i = 0; i < triggersSQL.length; i++) {
            try {
                await connection.execute(triggersSQL[i]);
                console.log(`   ✅ Trigger ${i + 1}/${triggersSQL.length} creado`);
            } catch (error) {
                console.log(`   ⚠️  Trigger ${i + 1} ya existe o error: ${error.message.substring(0, 50)}...`);
            }
        }
        
        // 8. Prueba básica del sistema
        console.log('\n📝 Paso 3: Probando el sistema...');
        
        // Insertar usuario de prueba
        await connection.execute(`
            INSERT INTO users (nombre, email, password, rol) VALUES 
            ('Usuario Test', 'test@trigamer.net', '$2b$10$test.hash', 'usuario')
        `);
        
        // Insertar noticia de prueba
        await connection.execute(`
            INSERT INTO news (titulo, descripcion, resumen, image_url, is_oficial, created_by) VALUES 
            ('Noticia de Prueba', 'Descripción de la noticia de prueba', 'Resumen', 'https://test.jpg', true, 1)
        `);
        
        // Insertar contenido de comunidad
        await connection.execute(`
            INSERT INTO com (titulo, descripcion, user_id) VALUES 
            ('Post Comunidad', 'Descripción del post', 1)
        `);
        
        // Verificar content_feed
        const [feedContent] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        console.log(`   ✅ Content feed tiene ${feedContent[0].count} elementos`);
        
        // 9. Estadísticas finales
        console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('━'.repeat(50));
        
        const [finalTables] = await connection.execute('SHOW TABLES');
        const [finalTriggers] = await connection.execute('SHOW TRIGGERS');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [news] = await connection.execute('SELECT COUNT(*) as count FROM news');
        const [com] = await connection.execute('SELECT COUNT(*) as count FROM com');
        const [feed] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        
        console.log('📊 RESUMEN DEL SISTEMA:');
        console.log(`   ✅ ${finalTables.length} tablas creadas`);
        console.log(`   ✅ ${finalTriggers.length} triggers activos`);
        console.log(`   ✅ ${users[0].count} usuarios`);
        console.log(`   ✅ ${news[0].count} noticias`);
        console.log(`   ✅ ${com[0].count} posts de comunidad`);
        console.log(`   ✅ ${feed[0].count} elementos en content_feed`);
        
        console.log('\n🚀 El sistema está listo para usar!');
        console.log('🔗 Acceso: admin@trigamer.net / Usuario Test: test@trigamer.net');
        
    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Solución: Verificar que MySQL esté ejecutándose');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Solución: Verificar credenciales en env.local');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

if (require.main === module) {
    setupDatabaseSimpleFeed().catch(console.error);
}

module.exports = setupDatabaseSimpleFeed; 