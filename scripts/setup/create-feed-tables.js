const mysql = require('mysql2/promise');

async function createFeedTables() {
    console.log('🚀 Creando tablas del feed unificado...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });
        
        // 1. Crear tabla content_feed
        console.log('📝 Creando tabla content_feed...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS content_feed (
                id INT(11) NOT NULL AUTO_INCREMENT,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT,
                resumen TEXT NULL,
                image_url VARCHAR(500) NULL,
                type TINYINT(1) NOT NULL COMMENT '1=noticia, 2=comunidad',
                original_id INT(11) NOT NULL COMMENT 'ID en tabla original (news/com)',
                user_id INT(11) NULL,
                user_name VARCHAR(100) NULL,
                published_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                -- Campos específicos de noticias
                original_url VARCHAR(500) NULL,
                is_oficial BOOLEAN DEFAULT FALSE,
                -- Campos específicos de comunidad
                video_url VARCHAR(500) NULL,
                -- Contadores (se actualizan automáticamente)
                likes_count INT(11) DEFAULT 0,
                comments_count INT(11) DEFAULT 0,
                PRIMARY KEY (id),
                -- Índices para optimización
                INDEX idx_type (type),
                INDEX idx_original_id (original_id),
                INDEX idx_type_original (type, original_id),
                INDEX idx_published_at (published_at),
                INDEX idx_user_id (user_id),
                -- Índice único para evitar duplicados
                UNIQUE KEY unique_type_original (type, original_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla content_feed creada');
        
        // 2. Crear tabla content_likes
        console.log('📝 Creando tabla content_likes...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS content_likes (
                id INT(11) NOT NULL AUTO_INCREMENT,
                content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
                user_id INT(11) NOT NULL COMMENT 'ID del usuario que dio like',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                -- Índices para optimizar consultas
                INDEX idx_content_id (content_id),
                INDEX idx_user_id (user_id),
                INDEX idx_content_user (content_id, user_id),
                -- Restricción única para evitar likes duplicados
                UNIQUE KEY unique_user_content (user_id, content_id),
                -- Claves foráneas
                FOREIGN KEY (content_id) REFERENCES content_feed(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla content_likes creada');
        
        // 3. Crear tabla content_comments
        console.log('📝 Creando tabla content_comments...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS content_comments (
                id INT(11) NOT NULL AUTO_INCREMENT,
                content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
                user_id INT(11) NOT NULL COMMENT 'ID del usuario que comentó',
                contenido TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                -- Índices
                INDEX idx_content_id (content_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at),
                -- Claves foráneas
                FOREIGN KEY (content_id) REFERENCES content_feed(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla content_comments creada');
        
        // 4. Migrar datos existentes al feed unificado
        console.log('📝 Migrando datos existentes...');
        await connection.execute(`
            INSERT IGNORE INTO content_feed (titulo, descripcion, resumen, image_url, type, original_id, published_at, original_url, is_oficial)
            SELECT titulo, descripcion, resumen, image_url, 1 as type, id as original_id, created_at as published_at, url as original_url, is_oficial
            FROM news
        `);
        console.log('✅ Datos de noticias migrados');
        
        await connection.execute(`
            INSERT IGNORE INTO content_feed (titulo, descripcion, type, original_id, published_at, video_url, user_id, user_name)
            SELECT titulo, descripcion, 2 as type, id as original_id, created_at as published_at, video_url, user_id, 
                   (SELECT name FROM users WHERE users.id = com.user_id) as user_name
            FROM com
        `);
        console.log('✅ Datos de comunicaciones migrados');
        
        // 5. Verificar datos
        console.log('📊 Verificando datos...');
        const [feedCount] = await connection.execute('SELECT COUNT(*) as count FROM content_feed');
        console.log(`✅ Items en feed: ${feedCount[0].count}`);
        
        console.log('\n🎉 Tablas del feed creadas exitosamente!');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createFeedTables(); 