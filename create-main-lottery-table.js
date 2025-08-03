const mysql = require('mysql2/promise');

async function createMainLotteryTable() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    console.log('🔌 Conectado a la base de datos');
    
    const createLotteriesQuery = `
      CREATE TABLE IF NOT EXISTS lotteries (
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL COMMENT 'Título de la lotería',
        description text COMMENT 'Descripción detallada',
        image_url varchar(500) DEFAULT NULL COMMENT 'URL de la imagen de la lotería',
        is_free tinyint(1) NOT NULL DEFAULT 0 COMMENT '0: Pago, 1: Gratuita',
        ticket_price decimal(10,2) DEFAULT 0.00 COMMENT 'Precio por ticket (0 para gratuitas)',
        min_tickets int(11) NOT NULL DEFAULT 1 COMMENT 'Número mínimo de tickets para iniciar',
        max_tickets int(11) NOT NULL COMMENT 'Número máximo de tickets disponibles',
        num_winners int(11) NOT NULL DEFAULT 1 COMMENT 'Número de ganadores',
        start_date datetime NOT NULL COMMENT 'Fecha y hora de inicio',
        end_date datetime NOT NULL COMMENT 'Fecha y hora de finalización',
        status enum('draft','active','closed','finished','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Estado de la lotería',
        created_by int(11) NOT NULL COMMENT 'ID del administrador que creó la lotería',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        winner_selected_at datetime DEFAULT NULL COMMENT 'Fecha cuando se seleccionaron los ganadores',
        prize_description text COMMENT 'Descripción del premio',
        terms_conditions text COMMENT 'Términos y condiciones',
        PRIMARY KEY (id),
        KEY idx_status (status),
        KEY idx_dates (start_date, end_date),
        KEY idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de loterías'
    `;
    
    console.log('📋 Creando tabla principal de loterías...');
    await conn.execute(createLotteriesQuery);
    console.log('✅ Tabla lotteries creada exitosamente');
    
    // Verificar que se creó
    const [tables] = await conn.execute("SHOW TABLES LIKE 'lotteries'");
    if (tables.length > 0) {
      console.log('🎉 Tabla lotteries confirmada');
    } else {
      console.log('❌ La tabla lotteries no se encontró');
    }
    
    await conn.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

createMainLotteryTable(); 