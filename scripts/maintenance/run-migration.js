const fs = require('fs');
const pool = require('./src/config/database');

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migración del sistema de feed unificado...');
    
    const sql = fs.readFileSync('migrate_unified_feed.sql', 'utf8');
    
    // Dividir por delimitadores especiales y punto y coma
    const statements = sql
      .split(/DELIMITER \$\$|DELIMITER ;/)
      .join('')
      .split(';')
      .filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await pool.execute(trimmed);
          console.log('✅ Ejecutado:', trimmed.substring(0, 80) + '...');
        } catch (err) {
          if (err.message.includes('already exists') || 
              err.message.includes('Duplicate entry') ||
              err.message.includes('doesn\'t exist')) {
            console.log('⚠️ Ignorado (ya existe):', trimmed.substring(0, 50) + '...');
          } else {
            console.error('❌ Error:', err.message);
            console.error('   Statement:', trimmed.substring(0, 100) + '...');
          }
        }
      }
    }
    
    // Verificar resultado
    console.log('\n📊 Verificando migración...');
    const [stats] = await pool.execute(`
      SELECT 
        'content_feed' as tabla,
        COUNT(*) as registros,
        COUNT(CASE WHEN type = 1 THEN 1 END) as noticias,
        COUNT(CASE WHEN type = 2 THEN 1 END) as comunidad,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM content_feed
    `);
    
    console.log('📋 Estadísticas:');
    console.log(stats[0]);
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error en migración:', error.message);
    process.exit(1);
  }
}

runMigration(); 