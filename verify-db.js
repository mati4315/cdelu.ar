const pool = require('./src/config/database');

(async () => {
  try {
    console.log('🔍 ANÁLISIS COMPLETO DE LA BASE DE DATOS\n');
    
    // 1. Base de datos actual
    const [db] = await pool.execute('SELECT DATABASE() as db');
    console.log(`🏷️ Base de datos: ${db[0].db}\n`);
    
    // 2. Todas las tablas
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 TABLAS EXISTENTES:');
    console.log('-'.repeat(30));
    tables.forEach((table, i) => {
      console.log(`${i + 1}. ${Object.values(table)[0]}`);
    });
    
    // 3. Verificar tablas específicas con conteos
    const checks = [
      'users', 'roles', 'news', 'comments', 'likes', 'com', 
      'content_feed', 'content_likes', 'content_comments',
      'com_likes', 'com_comments'
    ];
    
    console.log('\n📊 CONTEOS POR TABLA:');
    console.log('-'.repeat(30));
    
    for (const table of checks) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      if (exists) {
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${count[0].count} registros`);
      } else {
        console.log(`❌ ${table}: NO EXISTE`);
      }
    }
    
    // 4. Estado del sistema de feed unificado
    console.log('\n🎯 SISTEMA DE FEED UNIFICADO:');
    console.log('-'.repeat(30));
    
    const feedExists = tables.some(t => Object.values(t)[0] === 'content_feed');
    const likesExists = tables.some(t => Object.values(t)[0] === 'content_likes');
    const commentsExists = tables.some(t => Object.values(t)[0] === 'content_comments');
    
    if (feedExists && likesExists && commentsExists) {
      console.log('✅ Sistema unificado COMPLETO');
    } else if (feedExists) {
      console.log('⚠️ Sistema unificado PARCIAL');
      console.log(`   - content_feed: ${feedExists ? 'SÍ' : 'NO'}`);
      console.log(`   - content_likes: ${likesExists ? 'SÍ' : 'NO'}`);
      console.log(`   - content_comments: ${commentsExists ? 'SÍ' : 'NO'}`);
    } else {
      console.log('❌ Sistema unificado NO IMPLEMENTADO');
    }
    
    console.log('\n✨ Análisis completado');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
})(); 