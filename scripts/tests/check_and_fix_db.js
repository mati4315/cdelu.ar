/**
 * Script para verificar y arreglar la estructura de la base de datos
 */

require('dotenv').config();

async function checkAndFixDb() {
  try {
    const pool = require('./src/config/database');
    
    console.log('🔍 Verificando estructura de content_feed...');
    
    // Verificar si la tabla existe
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'content_feed'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  Tabla content_feed no existe. Creándola...');
      
      await pool.execute(`
        CREATE TABLE content_feed (
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
      
      console.log('✅ Tabla content_feed creada');
    } else {
      console.log('✅ Tabla content_feed existe');
      
      // Verificar si tiene la columna user_profile_picture
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'content_feed' 
        AND COLUMN_NAME = 'user_profile_picture'
      `);
      
      if (columns.length === 0) {
        console.log('⚠️  Columna user_profile_picture no existe. Agregándola...');
        
        await pool.execute(`
          ALTER TABLE content_feed 
          ADD COLUMN user_profile_picture VARCHAR(500) AFTER user_name
        `);
        
        console.log('✅ Columna user_profile_picture agregada');
      } else {
        console.log('✅ Columna user_profile_picture existe');
      }
    }
    
    // Verificar tabla users
    console.log('\n🔍 Verificando campos de usuarios...');
    
    const requiredFields = ['username', 'bio', 'location', 'website', 'is_verified', 'profile_picture_url'];
    
    for (const field of requiredFields) {
      const [fieldCheck] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = ?
      `, [field]);
      
      if (fieldCheck.length === 0) {
        console.log(`⚠️  Campo ${field} no existe. Agregándolo...`);
        
        let alterQuery = '';
        switch (field) {
          case 'username':
            alterQuery = 'ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER email';
            break;
          case 'bio':
            alterQuery = 'ALTER TABLE users ADD COLUMN bio TEXT AFTER username';
            break;
          case 'location':
            alterQuery = 'ALTER TABLE users ADD COLUMN location VARCHAR(255) AFTER bio';
            break;
          case 'website':
            alterQuery = 'ALTER TABLE users ADD COLUMN website VARCHAR(255) AFTER location';
            break;
          case 'is_verified':
            alterQuery = 'ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER website';
            break;
          case 'profile_picture_url':
            alterQuery = 'ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) AFTER is_verified';
            break;
        }
        
        try {
          await pool.execute(alterQuery);
          console.log(`✅ Campo ${field} agregado`);
        } catch (error) {
          if (!error.message.includes('Duplicate')) {
            console.warn(`⚠️  Error agregando ${field}: ${error.message}`);
          }
        }
      } else {
        console.log(`✅ Campo ${field} existe`);
      }
    }
    
    // Verificar tabla user_follows
    console.log('\n🔍 Verificando tabla user_follows...');
    
    const [followsTable] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_follows'
    `);
    
    if (followsTable.length === 0) {
      console.log('⚠️  Tabla user_follows no existe. Creándola...');
      
      await pool.execute(`
        CREATE TABLE user_follows (
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
      
      console.log('✅ Tabla user_follows creada');
    } else {
      console.log('✅ Tabla user_follows existe');
    }
    
    // Verificar tabla com_likes
    console.log('\n🔍 Verificando tabla com_likes...');
    
    const [comLikesTable] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'com_likes'
    `);
    
    if (comLikesTable.length === 0) {
      console.log('⚠️  Tabla com_likes no existe. Creándola...');
      
      await pool.execute(`
        CREATE TABLE com_likes (
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
      
      console.log('✅ Tabla com_likes creada');
    } else {
      console.log('✅ Tabla com_likes existe');
    }
    
    // Generar usernames para usuarios sin username
    console.log('\n🔍 Verificando usernames de usuarios...');
    
    const [usersWithoutUsername] = await pool.execute(`
      SELECT id, nombre 
      FROM users 
      WHERE username IS NULL OR username = ''
    `);
    
    if (usersWithoutUsername.length > 0) {
      console.log(`⚠️  ${usersWithoutUsername.length} usuarios sin username. Generando...`);
      
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
          console.log(`   📝 Username generado para ${user.nombre}: ${username}`);
        } catch (error) {
          console.warn(`   ⚠️  Error generando username para ${user.nombre}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Todos los usuarios tienen username');
    }
    
    console.log('\n🎉 ¡Estructura de base de datos verificada y corregida!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndFixDb();
