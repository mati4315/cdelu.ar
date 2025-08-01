const pool = require('./src/config/database');

async function checkTables() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');
    
    // Verificar base de datos actual
    const [db] = await pool.execute('SELECT DATABASE() as db');
    console.log(`🏷️ Base de datos actual: ${db[0].db}\n`);
    
    // Mostrar todas las tablas
    const [tables] = await pool.execute('SHOW TABLES');
    
    console.log('📋 TABLAS EXISTENTES:');
    console.log('='.repeat(50));
    
    if (tables.length === 0) {
      console.log('❌ No hay tablas en la base de datos');
      return;
    }
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ✅ ${Object.values(table)[0]}`);
    });
    
    console.log(`\n📊 Total de tablas: ${tables.length}`);
    
    // Verificar tablas específicas importantes
    const importantTables = [
      'users', 'roles', 'news', 'comments', 'likes', 'com', 
      'content_feed', 'content_likes', 'content_comments',
      'com_likes', 'com_comments'
    ];
    
    console.log('\n🎯 VERIFICACIÓN TABLAS IMPORTANTES:');
    console.log('='.repeat(50));
    
    for (const table of importantTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      if (exists) {
        try {
          const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`✅ ${table}: EXISTE (${count[0].count} registros)`);
        } catch (err) {
          console.log(`⚠️ ${table}: EXISTE pero error al contar - ${err.message}`);
        }
      } else {
        console.log(`❌ ${table}: NO EXISTE`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables(); 