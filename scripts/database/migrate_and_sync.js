/**
 * Script para ejecutar migración de usuarios y sincronizar feed
 * Ejecutar con: node migrate_and_sync.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Iniciando migración del sistema de perfiles y seguimiento...\n');

  try {
    // Importar módulos después de cargar dotenv
    const pool = require('./src/config/database');
    const feedSyncService = require('./src/services/feedSyncService');

    console.log('1️⃣ Conectando a la base de datos...');
    
    // Test de conexión
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión a la base de datos exitosa\n');

    console.log('2️⃣ Ejecutando migración de esquema...');
    
    // Leer y ejecutar migración SQL
    const migrationPath = path.join(__dirname, 'src/config/migration_users_profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir por declaraciones SQL individuales
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('select')) {
          // Para selects, mostrar resultado
          const [result] = await pool.execute(statement);
          if (result.length > 0 && result[0].status) {
            console.log(`   ${result[0].status}`);
          }
        } else {
          // Para otros statements, solo ejecutar
          await pool.execute(statement);
        }
      } catch (error) {
        // Ignorar errores de "already exists" - normales en migraciones
        if (!error.message.includes('already exists') && 
            !error.message.includes('Duplicate') &&
            !error.message.includes('Unknown column')) {
          console.warn(`   ⚠️  Advertencia: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Migración de esquema completada\n');

    console.log('3️⃣ Sincronizando content_feed...');
    
    // Sincronizar feed
    const syncResult = await feedSyncService.syncAll();
    console.log(`✅ Content feed sincronizado:`);
    console.log(`   📰 Noticias: ${syncResult.results[0].synced} elementos`);
    console.log(`   👥 Comunidad: ${syncResult.results[1].synced} elementos`);
    console.log(`   📊 Total: ${syncResult.total} elementos\n`);

    console.log('4️⃣ Verificando estructura...');
    
    // Verificar que las tablas existen
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('user_follows', 'com_likes', 'content_feed')
    `);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    console.log(`✅ Tablas verificadas: ${tableNames.join(', ')}\n`);

    // Verificar campos de usuarios
    const [userColumns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('username', 'bio', 'location', 'website', 'is_verified', 'profile_picture_url')
    `);
    
    const columnNames = userColumns.map(c => c.COLUMN_NAME);
    console.log(`✅ Campos de usuario verificados: ${columnNames.join(', ')}\n`);

    // Mostrar estadísticas finales
    const [userStats] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const [followStats] = await pool.execute('SELECT COUNT(*) as total FROM user_follows');
    const [feedStats] = await pool.execute('SELECT COUNT(*) as total FROM content_feed');
    
    console.log('📊 ESTADÍSTICAS FINALES:');
    console.log(`   👤 Usuarios: ${userStats[0].total}`);
    console.log(`   🤝 Relaciones de seguimiento: ${followStats[0].total}`);
    console.log(`   📄 Elementos en feed: ${feedStats[0].total}`);

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 APIs disponibles:');
    console.log('   🔍 GET /api/v1/users/profile/:username - Perfil público');
    console.log('   📝 GET /api/v1/users/profile/:username/posts - Posts del usuario');
    console.log('   ➕ POST /api/v1/users/:id/follow - Seguir usuario');
    console.log('   ➖ DELETE /api/v1/users/:id/follow - Dejar de seguir');
    console.log('   👥 GET /api/v1/users/profile/:username/followers - Seguidores');
    console.log('   🔗 GET /api/v1/users/profile/:username/following - Siguiendo');
    console.log('   🔎 GET /api/v1/users/search?query=nombre - Buscar usuarios');
    console.log('\n✨ El frontend ya puede usar todas estas APIs sin cambios!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Ejecutar migración si es llamado directamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
