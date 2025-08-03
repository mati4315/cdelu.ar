const mysql = require('mysql2/promise');
const fs = require('fs').promises;
require('dotenv').config();

async function setupLotterySimple() {
  let connection;
  
  try {
    console.log('🎰 Configurando sistema de lotería...');
    
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario'
    };
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión establecida');
    
    const sqlContent = await fs.readFile('create-lottery-tables-simple.sql', 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          console.log(`✅ Ejecutada declaración ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️ Error en declaración ${i + 1}: ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Configuración completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupLotterySimple(); 