const pool = require('./src/config/database');

async function createSurveyTables() {
  console.log('🚀 Creando tablas de encuestas...');
  
  try {
    // 1. Crear tabla surveys
    console.log('📝 Creando tabla surveys...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL COMMENT 'Título de la encuesta',
        description TEXT COMMENT 'Descripción de la encuesta',
        question TEXT NOT NULL COMMENT 'Pregunta principal',
        status ENUM('active', 'inactive', 'completed') DEFAULT 'active' COMMENT 'Estado de la encuesta',
        is_multiple_choice BOOLEAN DEFAULT FALSE COMMENT 'Permite selección múltiple',
        max_votes_per_user INT DEFAULT 1 COMMENT 'Máximo de votos por usuario',
        created_by INT COMMENT 'ID del administrador que creó la encuesta',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración de la encuesta',
        total_votes INT DEFAULT 0 COMMENT 'Total de votos recibidos',
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de encuestas'
    `);
    console.log('✅ Tabla surveys creada');

    // 2. Crear tabla survey_options
    console.log('📝 Creando tabla survey_options...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS survey_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        option_text VARCHAR(500) NOT NULL COMMENT 'Texto de la opción',
        votes_count INT DEFAULT 0 COMMENT 'Número de votos para esta opción',
        display_order INT DEFAULT 0 COMMENT 'Orden de visualización',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
        INDEX idx_survey_id (survey_id),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Opciones de respuesta para las encuestas'
    `);
    console.log('✅ Tabla survey_options creada');

    // 3. Crear tabla survey_votes
    console.log('📝 Creando tabla survey_votes...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS survey_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        option_id INT NOT NULL,
        user_id INT NULL COMMENT 'ID del usuario (NULL para votos anónimos)',
        user_ip VARCHAR(45) NULL COMMENT 'IP del usuario para evitar votos duplicados',
        user_agent TEXT NULL COMMENT 'User agent para tracking',
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES survey_options(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_vote (survey_id, user_id, option_id),
        UNIQUE KEY unique_ip_vote (survey_id, user_ip, option_id),
        INDEX idx_survey_id (survey_id),
        INDEX idx_option_id (option_id),
        INDEX idx_user_id (user_id),
        INDEX idx_voted_at (voted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de votos de usuarios'
    `);
    console.log('✅ Tabla survey_votes creada');

    // 4. Crear tabla survey_stats
    console.log('📝 Creando tabla survey_stats...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS survey_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        total_votes INT DEFAULT 0,
        unique_voters INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
        UNIQUE KEY unique_survey_stats (survey_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Estadísticas cacheadas de encuestas'
    `);
    console.log('✅ Tabla survey_stats creada');

    // 5. Insertar encuesta de ejemplo
    console.log('📝 Insertando encuesta de ejemplo...');
    await pool.execute(`
      INSERT INTO surveys (title, description, question, status, is_multiple_choice, max_votes_per_user, created_by) 
      VALUES (
        'Encuesta de Ejemplo',
        'Esta es una encuesta de ejemplo para probar el sistema',
        '¿Cuál es tu color favorito?',
        'active',
        FALSE,
        1,
        1
      )
    `);
    console.log('✅ Encuesta de ejemplo insertada');

    // 6. Insertar opciones de ejemplo
    console.log('📝 Insertando opciones de ejemplo...');
    await pool.execute(`
      INSERT INTO survey_options (survey_id, option_text, display_order) VALUES
      (1, 'Rojo', 1),
      (1, 'Azul', 2),
      (1, 'Verde', 3),
      (1, 'Amarillo', 4)
    `);
    console.log('✅ Opciones de ejemplo insertadas');

    // 7. Insertar votos de ejemplo
    console.log('📝 Insertando votos de ejemplo...');
    await pool.execute(`
      INSERT INTO survey_votes (survey_id, option_id, user_ip) VALUES
      (1, 1, '127.0.0.1'),
      (1, 2, '127.0.0.2'),
      (1, 1, '127.0.0.3'),
      (1, 3, '127.0.0.4')
    `);
    console.log('✅ Votos de ejemplo insertados');

    console.log('✅ Todas las tablas de encuestas creadas correctamente');
    
    // Verificar que las tablas se crearon
    const tables = ['surveys', 'survey_options', 'survey_votes', 'survey_stats'];
    
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Tabla ${table} existe`);
        } else {
          console.log(`❌ Tabla ${table} no existe`);
        }
      } catch (error) {
        console.error(`❌ Error verificando tabla ${table}:`, error.message);
      }
    }
    
    // Verificar datos de ejemplo
    try {
      const [surveys] = await pool.execute('SELECT COUNT(*) as count FROM surveys');
      const [options] = await pool.execute('SELECT COUNT(*) as count FROM survey_options');
      const [votes] = await pool.execute('SELECT COUNT(*) as count FROM survey_votes');
      
      console.log(`📊 Datos de ejemplo:`);
      console.log(`   - Encuestas: ${surveys[0].count}`);
      console.log(`   - Opciones: ${options[0].count}`);
      console.log(`   - Votos: ${votes[0].count}`);
    } catch (error) {
      console.error('❌ Error verificando datos:', error.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSurveyTables()
    .then(success => {
      if (success) {
        console.log('🎉 Tablas creadas exitosamente');
        process.exit(0);
      } else {
        console.error('💥 Error creando las tablas');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createSurveyTables; 