const mysql = require('mysql2/promise');
const fs = require('fs');

async function createLotteryTablesSafe() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    console.log('🔌 Conectado a la base de datos');
    
    // Definir las tablas que necesitamos crear
    const queries = [
      // Tabla principal de loterías
      `CREATE TABLE IF NOT EXISTS \`lotteries\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL COMMENT 'Título de la lotería',
        \`description\` text COMMENT 'Descripción detallada',
        \`image_url\` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen de la lotería',
        \`is_free\` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0: Pago, 1: Gratuita',
        \`ticket_price\` decimal(10,2) DEFAULT 0.00 COMMENT 'Precio por ticket (0 para gratuitas)',
        \`min_tickets\` int(11) NOT NULL DEFAULT 1 COMMENT 'Número mínimo de tickets para iniciar',
        \`max_tickets\` int(11) NOT NULL COMMENT 'Número máximo de tickets disponibles',
        \`num_winners\` int(11) NOT NULL DEFAULT 1 COMMENT 'Número de ganadores',
        \`start_date\` datetime NOT NULL COMMENT 'Fecha y hora de inicio',
        \`end_date\` datetime NOT NULL COMMENT 'Fecha y hora de finalización',
        \`status\` enum('draft','active','closed','finished','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Estado de la lotería',
        \`created_by\` int(11) NOT NULL COMMENT 'ID del administrador que creó la lotería',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`winner_selected_at\` datetime DEFAULT NULL COMMENT 'Fecha cuando se seleccionaron los ganadores',
        \`prize_description\` text COMMENT 'Descripción del premio',
        \`terms_conditions\` text COMMENT 'Términos y condiciones',
        PRIMARY KEY (\`id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_dates\` (\`start_date\`, \`end_date\`),
        KEY \`idx_created_by\` (\`created_by\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de loterías'`,
      
      // Tabla de números reservados
      `CREATE TABLE IF NOT EXISTS \`lottery_reserved_numbers\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`lottery_id\` int(11) NOT NULL COMMENT 'ID de la lotería',
        \`ticket_number\` int(11) NOT NULL COMMENT 'Número de ticket reservado',
        \`user_id\` int(11) NOT NULL COMMENT 'ID del usuario que reservó',
        \`reserved_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de reserva',
        \`expires_at\` timestamp NOT NULL COMMENT 'Fecha de expiración de la reserva',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_lottery_number\` (\`lottery_id\`, \`ticket_number\`),
        KEY \`idx_lottery_id\` (\`lottery_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_expires_at\` (\`expires_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Números reservados temporalmente'`
    ];
    
    // Ejecutar cada consulta individualmente
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        console.log(`📋 Ejecutando consulta ${i + 1}/${queries.length}...`);
        await conn.execute(query);
        console.log(`✅ Consulta ${i + 1} ejecutada exitosamente`);
      } catch (error) {
        console.log(`⚠️  Error en consulta ${i + 1}: ${error.message}`);
      }
    }
    
    // Verificar tablas existentes
    const [tables] = await conn.execute("SHOW TABLES LIKE 'lottery%'");
    console.log('\n📋 Tablas de lotería disponibles:');
    tables.forEach(table => {
      console.log(`   ✅ ${Object.values(table)[0]}`);
    });
    
    await conn.end();
    console.log('\n🎉 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

createLotteryTablesSafe(); 