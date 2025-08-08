const pool = require('./src/config/database');

/**
 * Script para aplicar la migración de fotos de perfil
 * Agrega el campo profile_picture_url a la tabla users
 */
async function applyProfilePictureMigration() {
  console.log('🔄 Iniciando migración de fotos de perfil...');

  try {
    // Verificar si la columna ya existe
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture_url'
    `);

    if (columns.length > 0) {
      console.log('✅ La columna profile_picture_url ya existe en la tabla users');
      return;
    }

    // Agregar la columna
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN profile_picture_url VARCHAR(500) NULL 
      COMMENT 'URL de la foto de perfil del usuario'
      AFTER password
    `);

    console.log('✅ Columna profile_picture_url agregada exitosamente');

    // Verificar la estructura de la tabla
    console.log('\n📋 Estructura actual de la tabla users:');
    const [structure] = await pool.query('DESCRIBE users');
    console.table(structure);

    // Crear directorio para fotos de perfil si no existe
    const fs = require('node:fs');
    const path = require('node:path');
    
    const profileDir = path.join(__dirname, 'public/uploads/profile-pictures');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
      console.log('✅ Directorio public/uploads/profile-pictures creado');
    } else {
      console.log('✅ Directorio public/uploads/profile-pictures ya existe');
    }

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\n📝 Nuevas funcionalidades disponibles:');
    console.log('  • POST /api/v1/profile/picture - Subir foto de perfil');
    console.log('  • DELETE /api/v1/profile/picture - Eliminar foto de perfil');
    console.log('  • GET /api/v1/profile/me - Obtener mi perfil');
    console.log('  • GET /api/v1/profile/:userId - Obtener perfil público');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  applyProfilePictureMigration()
    .then(() => {
      console.log('✅ Script de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de migración:', error);
      process.exit(1);
    });
}

module.exports = { applyProfilePictureMigration }; 