const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Script para migrar al sistema de feed unificado
 * Este script:
 * 1. Crea la tabla content_feed
 * 2. Instala los triggers
 * 3. Migra los datos existentes
 * 4. Verifica la migración
 */

async function runMigration() {
  console.log('🚀 Iniciando migración al sistema de feed unificado...');
  
  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '../../sql/migrate_to_feed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir el SQL en statements individuales
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Ejecutando ${statements.length} statements SQL...`);
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltar comentarios y líneas vacías
      if (!statement || statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`⏳ Ejecutando statement ${i + 1}/${statements.length}...`);
        await pool.execute(statement);
      } catch (error) {
        // Algunos errores son esperados (como DROP TRIGGER IF EXISTS)
        if (error.code === 'ER_TRG_DOES_NOT_EXIST' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1} (esperado): ${error.message}`);
          continue;
        }
        
        console.error(`❌ Error en statement ${i + 1}:`, error.message);
        console.error('Statement que falló:', statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    // Verificar la migración
    console.log('\n✅ Verificando la migración...');
    
    // Verificar que la tabla existe
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'content_feed'
    `);
    
    if (tables.length === 0) {
      throw new Error('La tabla content_feed no fue creada');
    }
    
    // Verificar que los triggers existen
    const [triggers] = await pool.execute(`
      SELECT TRIGGER_NAME 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = DATABASE() 
      AND TRIGGER_NAME LIKE '%news%' OR TRIGGER_NAME LIKE '%com%'
    `);
    
    console.log(`📋 Triggers creados: ${triggers.map(t => t.TRIGGER_NAME).join(', ')}`);
    
    // Obtener estadísticas de la migración
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) as noticias,
        SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as comunicaciones,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM content_feed
    `);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📊 Estadísticas de migración:');
      console.log(`   • Total de elementos: ${stat.total_items}`);
      console.log(`   • Noticias: ${stat.noticias}`);
      console.log(`   • Comunicaciones: ${stat.comunicaciones}`);
      console.log(`   • Total likes: ${stat.total_likes}`);
      console.log(`   • Total comentarios: ${stat.total_comments}`);
    }
    
    // Mostrar algunos ejemplos
    const [examples] = await pool.execute(`
      SELECT 
        type,
        titulo,
        user_name,
        published_at
      FROM content_feed 
      ORDER BY published_at DESC 
      LIMIT 5
    `);
    
    if (examples.length > 0) {
      console.log('\n📝 Ejemplos de contenido migrado:');
      examples.forEach((item, index) => {
        const typeLabel = item.type === 1 ? 'Noticia' : 'Comunidad';
        console.log(`   ${index + 1}. [${typeLabel}] ${item.titulo.substring(0, 50)}... (${item.user_name || 'Sin autor'})`);
      });
    }
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📚 Nuevas rutas disponibles:');
    console.log('   • GET /api/v1/feed - Todo el contenido');
    console.log('   • GET /api/v1/feed/noticias - Solo noticias');
    console.log('   • GET /api/v1/feed/comunidad - Solo comunidad');
    console.log('   • GET /api/v1/feed/stats - Estadísticas');
    console.log('   • POST /api/v1/feed/sync - Resincronizar (admin)');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('\n🔧 Para solucionar:');
    console.error('   1. Verifica la conexión a la base de datos');
    console.error('   2. Asegúrate de tener permisos para crear tablas y triggers');
    console.error('   3. Revisa que las tablas news, com y users existan');
    
    process.exit(1);
  }
}

/**
 * Función para verificar si la migración ya fue ejecutada
 */
async function checkMigrationStatus() {
  try {
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'content_feed'
    `);
    
    if (tables.length > 0) {
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM content_feed');
      return {
        exists: true,
        count: count[0].count
      };
    }
    
    return { exists: false, count: 0 };
  } catch (error) {
    return { exists: false, count: 0, error: error.message };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Verificando estado de la migración...');
  
  const status = await checkMigrationStatus();
  
  if (status.exists && status.count > 0) {
    console.log(`⚠️  La tabla content_feed ya existe con ${status.count} elementos.`);
    console.log('¿Deseas continuar? Esto puede duplicar datos.');
    
    // En un entorno de producción, aquí se podría agregar confirmación del usuario
    if (process.argv.includes('--force')) {
      console.log('🔄 Forzando migración...');
      await runMigration();
    } else {
      console.log('💡 Usa --force para forzar la migración o --sync para sincronizar.');
      
      if (process.argv.includes('--sync')) {
        console.log('🔄 Sincronizando feed...');
        // Usar la función de sincronización del controlador
        const { syncFeed } = require('../controllers/feedController');
        await syncFeed({ query: {} }, { 
          send: (data) => console.log('✅ Sincronización:', data),
          status: () => ({ send: (data) => console.log('❌ Error:', data) })
        });
      }
    }
  } else {
    await runMigration();
  }
  
  // Cerrar la conexión
  await pool.end();
  console.log('\n🔌 Conexión cerrada.');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  checkMigrationStatus
}; 