const mysql = require('mysql2/promise');

async function checkLotteryTables() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    console.log('🔍 Verificando tablas de lotería...');
    
    const [tables] = await conn.execute("SHOW TABLES LIKE 'lottery%'");
    console.log('📋 Tablas encontradas:', tables.map(t => Object.values(t)[0]));
    
    const expectedTables = ['lotteries', 'lottery_tickets', 'lottery_winners', 'lottery_reserved_numbers', 'lottery_settings'];
    
    const existingTables = tables.map(t => Object.values(t)[0]);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Tablas faltantes:', missingTables);
      console.log('💡 Ejecute: mysql -u root cdelu_ar < sql/create_lottery_tables.sql');
    } else {
      console.log('✅ Todas las tablas de lotería están presentes');
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (conn) await conn.end();
  }
}

checkLotteryTables(); 