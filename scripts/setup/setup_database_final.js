const mysql = require('mysql2/promise');
require('dotenv').config({ path: './env.local' });

async function setupDatabaseFinal() {
    console.log('🚀 Configuración Final del Sistema de Feed Unificado');
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
        console.log('🧹 Limpiando base de datos...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        const [tables] = await connection.execute('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        }
        
        // Eliminar triggers si existen
        const [existingTriggers] = await connection.execute('SHOW TRIGGERS');
        for (const trigger of existingTriggers) {
            await connection.query(`DROP TRIGGER IF EXISTS ${trigger.Trigger}`);
        }
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Base de datos limpia');
        
        // 3. Crear todas las tablas
        console.log('\n📝 Creando estructura de tablas...');
        
        const tablas = [
            {
                nombre: 'users',
                sql: `CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    rol ENUM('administrador', 'colaborador', 'usuario') DEFAULT 'usuario',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_rol (rol)
                )`
            },
            {
                nombre: 'news',
                sql: `CREATE TABLE news (
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
                )`
            },
            {
                nombre: 'com',
                sql: `CREATE TABLE com (
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
                )`
            },
            {
                nombre: 'content_feed',
                sql: `CREATE TABLE content_feed (
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
                )`
            },
            {
                nombre: 'likes',
                sql: `CREATE TABLE likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    news_id INT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_news (user_id, news_id)
                )`
            },
            {
                nombre: 'com_likes',
                sql: `CREATE TABLE com_likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    com_id INT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_com (user_id, com_id)
                )`
            },
            {
                nombre: 'comments',
                sql: `CREATE TABLE comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    news_id INT NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                    INDEX idx_news_id (news_id),
                    INDEX idx_user_id (user_id)
                )`
            },
            {
                nombre: 'com_comments',
                sql: `CREATE TABLE com_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    com_id INT NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
                    INDEX idx_com_id (com_id),
                    INDEX idx_user_id (user_id)
                )`
            }
        ];
        
        // Crear cada tabla
        for (const tabla of tablas) {
            await connection.execute(tabla.sql);
            console.log(`   ✅ ${tabla.nombre}`);
        }
        
        // 4. Insertar usuario administrador
        console.log('\n📝 Creando usuario administrador...');
        await connection.execute(`
            INSERT INTO users (id, nombre, email, password, rol) VALUES 
            (1, 'Administrador', 'admin@trigamer.net', '$2b$10$default.hash.password', 'administrador')
        `);
        console.log('✅ Usuario administrador creado');
        
        // 5. Crear triggers usando .query() 
        console.log('\n📝 Creando triggers de sincronización...');
        
        const triggers = [
            {
                nombre: 'after_news_insert',
                sql: `CREATE TRIGGER after_news_insert
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
                    )`
            },
            {
                nombre: 'after_news_update',
                sql: `CREATE TRIGGER after_news_update
                    AFTER UPDATE ON news
                    FOR EACH ROW
                    UPDATE content_feed SET
                        titulo = NEW.titulo,
                        descripcion = NEW.descripcion,
                        image_url = NEW.image_url,
                        published_at = COALESCE(NEW.published_at, NEW.created_at),
                        resumen = NEW.resumen,
                        original_url = NEW.original_url,
                        is_oficial = NEW.is_oficial,
                        updated_at = NOW()
                    WHERE type = 1 AND original_id = NEW.id`
            },
            {
                nombre: 'after_news_delete',
                sql: `CREATE TRIGGER after_news_delete
                    AFTER DELETE ON news
                    FOR EACH ROW
                    DELETE FROM content_feed WHERE type = 1 AND original_id = OLD.id`
            },
            {
                nombre: 'after_com_insert',
                sql: `CREATE TRIGGER after_com_insert
                    AFTER INSERT ON com
                    FOR EACH ROW
                    INSERT INTO content_feed (
                        titulo, descripcion, image_url, type, original_id, user_id, user_name,
                        published_at, video_url, likes_count, comments_count
                    ) VALUES (
                        NEW.titulo, NEW.descripcion, NEW.image_url, 2, NEW.id, NEW.user_id,
                        (SELECT nombre FROM users WHERE id = NEW.user_id),
                        NEW.created_at, NEW.video_url, 0, 0
                    )`
            },
            {
                nombre: 'after_com_update',
                sql: `CREATE TRIGGER after_com_update
                    AFTER UPDATE ON com
                    FOR EACH ROW
                    UPDATE content_feed SET
                        titulo = NEW.titulo,
                        descripcion = NEW.descripcion,
                        image_url = NEW.image_url,
                        video_url = NEW.video_url,
                        updated_at = NOW()
                    WHERE type = 2 AND original_id = NEW.id`
            },
            {
                nombre: 'after_com_delete',
                sql: `CREATE TRIGGER after_com_delete
                    AFTER DELETE ON com
                    FOR EACH ROW
                    DELETE FROM content_feed WHERE type = 2 AND original_id = OLD.id`
            },
            {
                nombre: 'after_likes_insert',
                sql: `CREATE TRIGGER after_likes_insert
                    AFTER INSERT ON likes
                    FOR EACH ROW
                    UPDATE content_feed SET 
                        likes_count = likes_count + 1, 
                        updated_at = NOW()
                    WHERE type = 1 AND original_id = NEW.news_id`
            },
            {
                nombre: 'after_likes_delete',
                sql: `CREATE TRIGGER after_likes_delete
                    AFTER DELETE ON likes
                    FOR EACH ROW
                    UPDATE content_feed SET 
                        likes_count = GREATEST(likes_count - 1, 0), 
                        updated_at = NOW()
                    WHERE type = 1 AND original_id = OLD.news_id`
            }
        ];
        
        // Crear cada trigger
        for (const trigger of triggers) {
            try {
                await connection.query(trigger.sql);
                console.log(`   ✅ ${trigger.nombre}`);
            } catch (error) {
                console.log(`   ⚠️  ${trigger.nombre}: ${error.message.substring(0, 50)}...`);
            }
        }
        
        // 6. Prueba del sistema
        console.log('\n📝 Probando el sistema con datos de ejemplo...');
        
        // Insertar usuario de prueba
        await connection.execute(`
            INSERT INTO users (nombre, email, password, rol) VALUES 
            ('Usuario Test', 'test@trigamer.net', '$2b$10$test.hash', 'usuario')
        `);
        console.log('   ✅ Usuario de prueba creado');
        
        // Insertar noticia (debería crear automáticamente en content_feed)
        await connection.execute(`
            INSERT INTO news (titulo, descripcion, resumen, image_url, is_oficial, created_by) VALUES 
            ('¡Sistema de Feed Funcionando!', 'Esta noticia se ha creado automáticamente para probar el sistema de feed unificado.', 'Prueba del sistema', 'https://test.jpg', true, 1)
        `);
        console.log('   ✅ Noticia de prueba creada');
        
        // Insertar contenido de comunidad (debería crear automáticamente en content_feed)
        await connection.execute(`
            INSERT INTO com (titulo, descripcion, user_id) VALUES 
            ('Post de Bienvenida', 'Este es el primer post de la comunidad en el nuevo sistema.', 2)
        `);
        console.log('   ✅ Post de comunidad creado');
        
        // Verificar que se sincronizó automáticamente
        const [feedCheck] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        console.log(`   🔄 Content feed: ${feedCheck[0].count} elementos sincronizados automáticamente`);
        
        // 7. Estadísticas finales
        console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('━'.repeat(60));
        
        // Obtener estadísticas
        const [finalTables] = await connection.execute('SHOW TABLES');
        const [finalTriggers] = await connection.execute('SHOW TRIGGERS');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [news] = await connection.execute('SELECT COUNT(*) as count FROM news');
        const [com] = await connection.execute('SELECT COUNT(*) as count FROM com');
        const [feed] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        
        console.log('📊 RESUMEN COMPLETO DEL SISTEMA:');
        console.log(`   🗄️  ${finalTables.length} tablas creadas`);
        console.log(`   ⚡ ${finalTriggers.length} triggers automáticos activos`);
        console.log(`   👥 ${users[0].count} usuarios registrados`);
        console.log(`   📰 ${news[0].count} noticias`);
        console.log(`   💬 ${com[0].count} posts de comunidad`);
        console.log(`   🔄 ${feed[0].count} elementos en feed unificado`);
        
        console.log('\n🎯 SISTEMA DE FEED UNIFICADO LISTO PARA USAR!');
        console.log('━'.repeat(50));
        console.log('🔑 Credenciales de acceso:');
        console.log('   👤 Administrador: admin@trigamer.net');
        console.log('   👤 Usuario test: test@trigamer.net');
        
        console.log('\n📋 Tablas del sistema:');
        finalTables.forEach(tabla => {
            console.log(`   📋 ${Object.values(tabla)[0]}`);
        });
        
        console.log('\n⚡ Triggers activos:');
        finalTriggers.forEach(trigger => {
            console.log(`   ⚡ ${trigger.Trigger} (${trigger.Event} on ${trigger.Table})`);
        });
        
        console.log('\n🚀 ¡El backend está listo! Puedes iniciar con: npm start');
        
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
    setupDatabaseFinal().catch(console.error);
}

module.exports = setupDatabaseFinal; 