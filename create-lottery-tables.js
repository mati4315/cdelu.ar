const mysql = require('mysql2/promise');
const fs = require('fs');

async function createLotteryTables() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario',
      multipleStatements: true
    });

    console.log('🔌 Conectado a la base de datos');
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('sql/create_lottery_tables.sql', 'utf8');
    
    console.log('📄 Ejecutando script SQL...');
    
    // Ejecutar el script
    await conn.execute(sqlContent);
    
    console.log('✅ Tablas de lotería creadas exitosamente');
    
    // Verificar que se crearon
    const [tables] = await conn.execute("SHOW TABLES LIKE 'lottery%'");
    console.log('📋 Tablas creadas:', tables.map(t => Object.values(t)[0]));
    
    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

createLotteryTables(); 