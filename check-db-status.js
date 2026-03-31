const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'w35115415',
      database: 'trigamer_diario',
      charset: 'utf8mb4'
    });

    console.log('📋 DIAGNOSTICO DE BASE DE DATOS\n');
    
    // Obtener tablas
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('📊 TABLAS EN BD (trigamer_diario):');
    tables.forEach(t => console.log('  ✓', Object.values(t)[0]));
    console.log(`\n📈 Total de tablas: ${tables.length}\n`);

    // Verificar datos en cada tabla importante
    const tablesCheck = [
      'news',
      'news_external',
      'users',
      'comments',
      'surveys',
      'lotteries',
      'feed',
      'content_feed'
    ];

    console.log('📌 DATOS POR TABLA:\n');
    for (const table of tablesCheck) {
      try {
        const [result] = await conn.execute(`SELECT COUNT(*) as total FROM ${table}`);
        const count = result[0].total;
        const symbol = count > 0 ? '✅' : '⚠️';
        console.log(`  ${symbol} ${table.padEnd(20)}: ${count} registros`);
      } catch (e) {
        console.log(`  ❌ ${table.padEnd(20)}: NO EXISTE`);
      }
    }

    console.log('\n🔍 VERIFICACION DE ESTRUCTURA:\n');
    
    // Verificar estructura de feed table
    try {
      const [feedStructure] = await conn.execute('DESCRIBE feed');
      console.log('✓ Tabla "feed" existe con columnas:');
      feedStructure.forEach(col => {
        console.log(`    - ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.log('❌ Tabla "feed" NO EXISTE');
    }

    console.log('\n🔍 ESTADO DEL SERVIDOR:\n');
    
    // Info de servidor
    const [serverInfo] = await conn.execute('SELECT VERSION() as version, USER() as user, DATABASE() as db');
    console.log(`  Versión MySQL: ${serverInfo[0].version}`);
    console.log(`  Usuario: ${serverInfo[0].user}`);
    console.log(`  BD Actual: ${serverInfo[0].db}`);

    conn.end();
    
  } catch (e) {
    console.error('❌ ERROR:', e.message);
    console.error(e);
  }
})();
