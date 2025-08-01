const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    let connection;
    
    try {
        // 1. Conectar sin base de datos para crearla
        console.log('📝 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: ''
        });
        console.log('✅ Conectado a MySQL');
        
        // 2. Crear la base de datos
        console.log('📝 Creando base de datos...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base de datos creada');
        
        // 3. Cerrar conexión y reconectar con la base de datos
        await connection.end();
        
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });
        console.log('✅ Conectado a trigamer_diario');
        
        // 4. Crear tabla de usuarios
        console.log('📝 Creando tabla de usuarios...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'editor', 'colaborador', 'usuario') DEFAULT 'usuario',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla users creada');
        
        // 5. Crear tabla de noticias
        console.log('📝 Creando tabla de noticias...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS news (
                id INT(11) NOT NULL AUTO_INCREMENT,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT,
                resumen TEXT,
                image_url VARCHAR(500),
                url VARCHAR(500),
                is_oficial BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_created_at (created_at),
                INDEX idx_is_oficial (is_oficial)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla news creada');
        
        // 6. Crear tabla de comunicaciones
        console.log('📝 Creando tabla de comunicaciones...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS com (
                id INT(11) NOT NULL AUTO_INCREMENT,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT,
                video_url VARCHAR(500),
                user_id INT(11),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla com creada');
        
        // 7. Crear tabla de likes
        console.log('📝 Creando tabla de likes...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT(11) NOT NULL AUTO_INCREMENT,
                news_id INT(11) NOT NULL,
                user_id INT(11) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_user_news (user_id, news_id),
                INDEX idx_news_id (news_id),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla likes creada');
        
        // 8. Crear tabla de comentarios
        console.log('📝 Creando tabla de comentarios...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT(11) NOT NULL AUTO_INCREMENT,
                news_id INT(11) NOT NULL,
                user_id INT(11) NOT NULL,
                contenido TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_news_id (news_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla comments creada');
        
        // 9. Insertar usuario de prueba
        console.log('📝 Insertando usuario de prueba...');
        await connection.execute(`
            INSERT IGNORE INTO users (name, email, password, role) VALUES
            ('Test User', 'test@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario')
        `);
        console.log('✅ Usuario de prueba creado');
        
        // 10. Insertar noticia de ejemplo
        console.log('📝 Insertando noticia de ejemplo...');
        await connection.execute(`
            INSERT IGNORE INTO news (titulo, descripcion, resumen, image_url, url, is_oficial) VALUES
            ('Pymes entrerrianas convocadas para exposición rural 2025', 'El Ministerio de Desarrollo Económico de Entre Ríos convoca a pymes de la provincia para participar en la exposición rural 2025.', 'Convocatoria para pymes entrerrianas en exposición rural 2025', 'https://example.com/image1.jpg', 'https://forms.comunicacionentrerios.com', TRUE)
        `);
        console.log('✅ Noticia de ejemplo creada');
        
        // 11. Verificar datos
        console.log('📊 Verificando datos...');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [news] = await connection.execute('SELECT COUNT(*) as count FROM news');
        
        console.log(`✅ Usuarios: ${users[0].count}`);
        console.log(`✅ Noticias: ${news[0].count}`);
        
        console.log('\n🎉 Configuración completada!');
        console.log('📋 Información de acceso:');
        console.log('   - Base de datos: trigamer_diario');
        console.log('   - Usuario test: test@test.com');
        console.log('   - Contraseña: password');
        
    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

setupDatabase().catch(console.error); 