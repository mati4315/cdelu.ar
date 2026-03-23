/**
 * Script para migrar las tablas necesarias a trigamer_diario
 */

require('dotenv').config();

async function migrateToTrigamerDb() {
  console.log('🚀 Migrando sistema de perfiles a trigamer_diario...\n');

  try {
    const pool = require('./src/config/database');
    
    console.log('1️⃣ Conectando a la base de datos trigamer_diario...');
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión exitosa\n');

    console.log('2️⃣ Creando tabla roles si no existe...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    
    // Insertar roles si no existen
    await pool.execute(`INSERT IGNORE INTO roles (nombre) VALUES ('administrador'), ('colaborador'), ('usuario')`);
    console.log('✅ Tabla roles creada\n');

    console.log('3️⃣ Verificando y agregando campos a users...');
    
    const userFields = [
      { name: 'username', sql: 'ADD COLUMN username VARCHAR(50) UNIQUE AFTER email' },
      { name: 'bio', sql: 'ADD COLUMN bio TEXT AFTER username' },
      { name: 'location', sql: 'ADD COLUMN location VARCHAR(255) AFTER bio' },
      { name: 'website', sql: 'ADD COLUMN website VARCHAR(255) AFTER location' },
      { name: 'is_verified', sql: 'ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER website' },
      { name: 'profile_picture_url', sql: 'ADD COLUMN profile_picture_url VARCHAR(500) AFTER is_verified' }
    ];

    for (const field of userFields) {
      try {
        const [columns] = await pool.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = ?
        `, [field.name]);
        
        if (columns.length === 0) {
          await pool.execute(`ALTER TABLE users ${field.sql}`);
          console.log(`   ✅ Campo ${field.name} agregado`);
        } else {
          console.log(`   ✅ Campo ${field.name} ya existe`);
        }
      } catch (error) {
        if (!error.message.includes('Duplicate')) {
          console.warn(`   ⚠️  Error con campo ${field.name}: ${error.message}`);
        }
      }
    }

    console.log('\n4️⃣ Creando tabla user_follows...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INT PRIMARY KEY AUTO_INCREMENT,
        follower_id INT NOT NULL COMMENT 'Usuario que sigue',
        following_id INT NOT NULL COMMENT 'Usuario seguido', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id)
      )
    `);
    console.log('✅ Tabla user_follows creada\n');

    console.log('5️⃣ Creando tabla com_likes...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS com_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        com_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
        UNIQUE KEY unique_com_like (user_id, com_id),
        INDEX idx_user_com_likes (user_id),
        INDEX idx_com_likes (com_id)
      )
    `);
    console.log('✅ Tabla com_likes creada\n');

    console.log('6️⃣ Creando tabla content_feed...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS content_feed (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type TINYINT NOT NULL COMMENT '1=news, 2=com',
        original_id INT NOT NULL COMMENT 'ID del contenido original',
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        resumen TEXT,
        image_url VARCHAR(500),
        video_url VARCHAR(500),
        user_id INT,
        user_name VARCHAR(100),
        user_profile_picture VARCHAR(500),
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        original_url VARCHAR(500),
        is_oficial BOOLEAN DEFAULT FALSE,
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        INDEX idx_type_original (type, original_id),
        INDEX idx_user_content (user_id),
        INDEX idx_published_at (published_at),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Tabla content_feed creada\n');

    console.log('7️⃣ Generando usernames para usuarios existentes...');
    const [usersWithoutUsername] = await pool.execute(`
      SELECT id, nombre 
      FROM users 
      WHERE username IS NULL OR username = ''
    `);
    
    if (usersWithoutUsername.length > 0) {
      console.log(`   📝 Generando usernames para ${usersWithoutUsername.length} usuarios...`);
      
      for (const user of usersWithoutUsername) {
        const username = user.nombre
          .toLowerCase()
          .trim()
          .replace(/[áàâã]/g, 'a')
          .replace(/[éèê]/g, 'e')
          .replace(/[íìî]/g, 'i')
          .replace(/[óòôõ]/g, 'o')
          .replace(/[úùû]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[ñ]/g, 'n')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '.')
          + '.' + user.id;
        
        try {
          await pool.execute(
            'UPDATE users SET username = ? WHERE id = ?',
            [username, user.id]
          );
          console.log(`      📝 ${user.nombre} → ${username}`);
        } catch (error) {
          console.warn(`      ⚠️  Error generando username para ${user.nombre}: ${error.message}`);
        }
      }
    } else {
      console.log('   ✅ Todos los usuarios ya tienen username');
    }

    console.log('\n8️⃣ Sincronizando content_feed...');
    const feedSyncService = require('./src/services/feedSyncService');
    const syncResult = await feedSyncService.syncAll();
    console.log(`✅ Content feed sincronizado:`);
    console.log(`   📰 Noticias: ${syncResult.results[0].synced} elementos`);
    console.log(`   👥 Comunidad: ${syncResult.results[1].synced} elementos`);

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EN TRIGAMER_DIARIO!');
    console.log('\n📋 APIs listas para usar:');
    console.log('   🔍 GET /api/v1/users/profile/:username');
    console.log('   📝 GET /api/v1/users/profile/:username/posts');
    console.log('   ➕ POST /api/v1/users/:id/follow');
    console.log('   ➖ DELETE /api/v1/users/:id/follow');
    console.log('   👥 GET /api/v1/users/profile/:username/followers');
    console.log('   🔗 GET /api/v1/users/profile/:username/following');
    console.log('   🔎 GET /api/v1/users/search?query=nombre');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    process.exit(0);
  }
}

migrateToTrigamerDb();
