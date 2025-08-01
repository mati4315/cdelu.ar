const mysql = require('mysql2/promise');
require('dotenv').config({ path: './env.local' });

async function setupDatabaseManual() {
    console.log('🚀 Configuración Manual del Sistema de Feed Unificado');
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
        
        await connection.execute('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base de datos trigamer_diario creada');
        
        await connection.end();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'trigamer_diario'
        });
        console.log('✅ Conectado a trigamer_diario');
        
        // 2. Limpiar base de datos
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        const [tables] = await connection.execute('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        }
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Base de datos limpia');
        
        // 3. Crear tabla users
        console.log('\n📝 Creando tabla users...');
        await connection.execute(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol ENUM('administrador', 'colaborador', 'usuario') DEFAULT 'usuario',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_rol (rol)
            )
        `);
        console.log('✅ Tabla users creada');
        
        // 4. Crear tabla news
        console.log('📝 Creando tabla news...');
        await connection.execute(`
            CREATE TABLE news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT NOT NULL,
                resumen TEXT,
                image_url VARCHAR(500),
                original_url VARCHAR(500),
                is_oficial BOOLEAN DEFAULT FALSE,
                published_at DATETIME,
                created_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_published_at (published_at),
                INDEX idx_is_oficial (is_oficial)
            )
        `);
        console.log('✅ Tabla news creada');
        
        // 5. Crear tabla com
        console.log('📝 Creando tabla com...');
        await connection.execute(`
            CREATE TABLE com (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT NOT NULL,
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                user_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ Tabla com creada');
        
        // 6. Crear tabla content_feed
        console.log('📝 Creando tabla content_feed...');
        await connection.execute(`
            CREATE TABLE content_feed (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT NOT NULL,
                image_url VARCHAR(500) NULL,
                type TINYINT NOT NULL,
                original_id INT NOT NULL,
                user_id INT NULL,
                user_name VARCHAR(100) NULL,
                published_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                resumen TEXT NULL,
                original_url VARCHAR(500) NULL,
                is_oficial BOOLEAN NULL,
                video_url VARCHAR(500) NULL,
                likes_count INT DEFAULT 0,
                comments_count INT DEFAULT 0,
                INDEX idx_type (type),
                INDEX idx_published_at (published_at),
                INDEX idx_type_published (type, published_at),
                INDEX idx_original (type, original_id),
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ Tabla content_feed creada');
        
        // 7. Crear tablas de likes
        console.log('📝 Creando tabla likes...');
        await connection.execute(`
            CREATE TABLE likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                news_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_news (user_id, news_id)
            )
        `);
        console.log('✅ Tabla likes creada');
        
        console.log('📝 Creando tabla com_likes...');
        await connection.execute(`
            CREATE TABLE com_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                com_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_com (user_id, com_id)
            )
        `);
        console.log('✅ Tabla com_likes creada');
        
        // 8. Crear tablas de comentarios
        console.log('📝 Creando tabla comments...');
        await connection.execute(`
            CREATE TABLE comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                news_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                INDEX idx_news_id (news_id),
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ Tabla comments creada');
        
        console.log('📝 Creando tabla com_comments...');
        await connection.execute(`
            CREATE TABLE com_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                com_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
                INDEX idx_com_id (com_id),
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ Tabla com_comments creada');
        
        // 9. Insertar usuario administrador
        console.log('\n📝 Creando usuario administrador...');
        await connection.execute(`
            INSERT INTO users (id, nombre, email, password, rol) VALUES 
            (1, 'Administrador', 'admin@trigamer.net', '$2b$10$default.hash.password', 'administrador')
        `);
        console.log('✅ Usuario administrador creado');
        
        // 10. Crear triggers básicos
        console.log('\n📝 Creando triggers básicos...');
        
        // Trigger para sincronizar news -> content_feed
        await connection.execute(`
            CREATE TRIGGER after_news_insert_simple
            AFTER INSERT ON news
            FOR EACH ROW
            INSERT INTO content_feed (
                titulo, descripcion, image_url, type, original_id, user_id, user_name, 
                published_at, resumen, original_url, is_oficial, likes_count, comments_count
            ) VALUES (
                NEW.titulo, NEW.descripcion, NEW.image_url, 1, NEW.id, NEW.created_by,
                (SELECT nombre FROM users WHERE id = NEW.created_by),
                COALESCE(NEW.published_at, NEW.created_at), NEW.resumen, NEW.original_url, 
                NEW.is_oficial, 0, 0
            )
        `);
        console.log('✅ Trigger news insert creado');
        
        // Trigger para sincronizar com -> content_feed
        await connection.execute(`
            CREATE TRIGGER after_com_insert_simple
            AFTER INSERT ON com
            FOR EACH ROW
            INSERT INTO content_feed (
                titulo, descripcion, image_url, type, original_id, user_id, user_name,
                published_at, video_url, likes_count, comments_count
            ) VALUES (
                NEW.titulo, NEW.descripcion, NEW.image_url, 2, NEW.id, NEW.user_id,
                (SELECT nombre FROM users WHERE id = NEW.user_id),
                NEW.created_at, NEW.video_url, 0, 0
            )
        `);
        console.log('✅ Trigger com insert creado');
        
        // 11. Prueba del sistema
        console.log('\n📝 Probando el sistema...');
        
        // Insertar datos de prueba
        await connection.execute(`
            INSERT INTO users (nombre, email, password, rol) VALUES 
            ('Usuario Test', 'test@trigamer.net', '$2b$10$test.hash', 'usuario')
        `);
        
        await connection.execute(`
            INSERT INTO news (titulo, descripcion, resumen, image_url, is_oficial, created_by) VALUES 
            ('Noticia de Prueba', 'Esta es una noticia de prueba para verificar el sistema', 'Resumen de prueba', 'https://test.jpg', true, 1)
        `);
        
        await connection.execute(`
            INSERT INTO com (titulo, descripcion, user_id) VALUES 
            ('Post de Comunidad', 'Este es un post de prueba de la comunidad', 2)
        `);
        
        // Verificar content_feed
        const [feedCheck] = await connection.execute('SELECT * FROM content_feed');
        console.log(`✅ Content feed tiene ${feedCheck.length} elementos automáticamente sincronizados`);
        
        // 12. Estadísticas finales
        console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('━'.repeat(60));
        
        const [finalTables] = await connection.execute('SHOW TABLES');
        const [finalTriggers] = await connection.execute('SHOW TRIGGERS');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [news] = await connection.execute('SELECT COUNT(*) as count FROM news');
        const [com] = await connection.execute('SELECT COUNT(*) as count FROM com');
        const [feed] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        
        console.log('📊 RESUMEN COMPLETO DEL SISTEMA:');
        console.log(`   🗄️  ${finalTables.length} tablas creadas`);
        console.log(`   ⚡ ${finalTriggers.length} triggers activos`);
        console.log(`   👥 ${users[0].count} usuarios registrados`);
        console.log(`   📰 ${news[0].count} noticias`);
        console.log(`   💬 ${com[0].count} posts de comunidad`);
        console.log(`   🔄 ${feed[0].count} elementos en feed unificado`);
        
        console.log('\n🎯 SISTEMA DE FEED UNIFICADO LISTO!');
        console.log('━'.repeat(40));
        console.log('🔑 Credenciales de acceso:');
        console.log('   👤 Admin: admin@trigamer.net');
        console.log('   👤 Test: test@trigamer.net');
        
        console.log('\n📋 Tablas principales:');
        finalTables.forEach(tabla => {
            console.log(`   📋 ${Object.values(tabla)[0]}`);
        });
        
        console.log('\n🚀 ¡Puedes iniciar la aplicación con: npm start');
        
    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

if (require.main === module) {
    setupDatabaseManual().catch(console.error);
}

module.exports = setupDatabaseManual; 