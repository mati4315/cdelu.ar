const fs = require('fs');
const pool = require('./src/config/database');

async function completeMigration() {
  try {
    console.log('🎯 Completando Sistema de Feed Unificado...\n');
    
    const sql = fs.readFileSync('complete-unified-system.sql', 'utf8');
    
    // Dividir en declaraciones individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.includes('UNION ALL'));
    
    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...\n`);
    
    for (const [index, statement] of statements.entries()) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log(`✅ ${index + 1}. ${statement.substring(0, 60)}...`);
        } catch (err) {
          if (err.message.includes('already exists') || 
              err.message.includes('Duplicate entry')) {
            console.log(`⚠️ ${index + 1}. Ya existe: ${statement.substring(0, 40)}...`);
          } else {
            console.error(`❌ ${index + 1}. Error: ${err.message}`);
            console.error(`    Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Verificar resultado final
    console.log('\n📊 Verificando migración...');
    
    const [contentFeed] = await pool.execute('SELECT COUNT(*) as count FROM content_feed');
    const [contentLikes] = await pool.execute('SELECT COUNT(*) as count FROM content_likes');
    const [contentComments] = await pool.execute('SELECT COUNT(*) as count FROM content_comments');
    
    console.log('\n✅ RESULTADOS FINALES:');
    console.log(`   - content_feed: ${contentFeed[0].count} registros`);
    console.log(`   - content_likes: ${contentLikes[0].count} registros`);
    console.log(`   - content_comments: ${contentComments[0].count} registros`);
    
    // Verificar estadísticas de migración
    const [stats] = await pool.execute(`
      SELECT 
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        COUNT(CASE WHEN type = 1 THEN 1 END) as noticias,
        COUNT(CASE WHEN type = 2 THEN 1 END) as comunidad
      FROM content_feed
    `);
    
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   - Total noticias: ${stats[0].noticias}`);
    console.log(`   - Total comunidad: ${stats[0].comunidad}`);
    console.log(`   - Total likes: ${stats[0].total_likes}`);
    console.log(`   - Total comentarios: ${stats[0].total_comments}`);
    
    console.log('\n🎉 ¡Sistema de Feed Unificado completado exitosamente!');
    
  } catch (error) {
    console.error('💥 Error en migración:', error.message);
  } finally {
    process.exit(0);
  }
}

completeMigration(); 