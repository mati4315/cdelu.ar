const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Script para configurar la base de datos del sistema de lotería
 */

async function setupLotteryDatabase() {
  let connection;
  
  try {
    console.log('🎰 Configurando sistema de lotería...');
    
    // Configuración de conexión
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario',
      multipleStatements: false // Cambiar a false para ejecutar por separado
    };
    
    // Crear conexión
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión a la base de datos establecida');
    
    // Leer archivo SQL
    const sqlFilePath = path.join(__dirname, 'sql', 'create_lottery_tables.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('📄 Ejecutando script SQL...');
    
    // Dividir el SQL en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Ejecutar cada declaración por separado
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Ejecutada declaración ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️ Error en declaración ${i + 1}: ${error.message}`);
          // Continuar con las siguientes declaraciones
        }
      }
    }
    
    console.log('✅ Tablas de lotería creadas exitosamente');
    
    // Verificar que las tablas se crearon correctamente
    const tables = [
      'lotteries',
      'lottery_tickets', 
      'lottery_reserved_numbers',
      'lottery_winners',
      'lottery_settings'
    ];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
      if (rows.length > 0) {
        console.log(`✅ Tabla '${table}' creada correctamente`);
      } else {
        console.log(`❌ Error: Tabla '${table}' no se creó`);
      }
    }
    
    // Verificar configuraciones por defecto
    try {
      const [settings] = await connection.execute(`
        SELECT setting_key, setting_value FROM lottery_settings
      `);
      
      console.log('📋 Configuraciones por defecto:');
      settings.forEach(setting => {
        console.log(`  - ${setting.setting_key}: ${setting.setting_value}`);
      });
    } catch (error) {
      console.log('⚠️ No se pudieron verificar las configuraciones:', error.message);
    }
    
    console.log('\n🎉 Sistema de lotería configurado exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('  1. Ejecutar el servidor: npm start');
    console.log('  2. Crear un usuario administrador');
    console.log('  3. Acceder al dashboard para crear loterías');
    console.log('  4. Probar el sistema con loterías gratuitas y de pago');
    
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
    console.error('Detalles del error:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 Sugerencia: Verifica que la tabla "users" existe');
      console.log('   Ejecuta primero: node setup-database.js');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupLotteryDatabase();
}

module.exports = setupLotteryDatabase; 