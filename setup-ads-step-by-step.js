const mysql = require('mysql2/promise');

/**
 * Script para configurar la base de datos de anuncios paso a paso
 */
async function setupAdsDatabase() {
  console.log('🚀 Configurando base de datos de anuncios paso a paso...\n');

  let connection;
  
  try {
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario'
    };

    console.log('📡 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida\n');

    // 1. Crear tabla ads
    console.log('1️⃣ Creando tabla ads...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        image_url VARCHAR(500),
        enlace_destino VARCHAR(500) NOT NULL,
        texto_opcional VARCHAR(255),
        categoria VARCHAR(100) DEFAULT 'general',
        prioridad INT DEFAULT 1,
        activo BOOLEAN DEFAULT TRUE,
        impresiones_maximas INT DEFAULT 0,
        impresiones_actuales INT DEFAULT 0,
        clics_count INT DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_activo (activo),
        INDEX idx_categoria (categoria),
        INDEX idx_prioridad (prioridad)
      )
    `);
    console.log('✅ Tabla ads creada\n');

    // 2. Insertar datos de prueba
    console.log('2️⃣ Insertando datos de prueba...');
    await connection.execute(`
      INSERT INTO ads (titulo, descripcion, image_url, enlace_destino, texto_opcional, categoria, prioridad, activo, created_by) VALUES
      ('Patrocinado por Trigamer', 'Descubre los mejores juegos y noticias gaming', 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Trigamer+Ad', 'https://trigamer.xyz', '¡Juega y gana!', 'gaming', 1, TRUE, 1),
      ('Oferta Especial', 'Productos tecnológicos con descuento', 'https://via.placeholder.com/400x200/10b981/ffffff?text=Tech+Ad', 'https://techstore.com', 'Hasta 50% de descuento', 'tecnologia', 2, TRUE, 1),
      ('Evento Gaming', 'Torneo de videojuegos este fin de semana', 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=Event+Ad', 'https://eventos.com', '¡Inscríbete gratis!', 'eventos', 1, TRUE, 1)
    `);
    console.log('✅ Datos de prueba insertados\n');

    // 3. Verificar estructura
    console.log('3️⃣ Verificando estructura...');
    
    // Verificar tabla ads
    const [adsTables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'ads'
    `, [dbConfig.database]);
    
    if (adsTables[0].count > 0) {
      console.log('✅ Tabla `ads` creada correctamente');
    } else {
      console.log('❌ Error: Tabla `ads` no se creó');
    }

    // Verificar datos de prueba
    const [adsCount] = await connection.execute('SELECT COUNT(*) as count FROM ads');
    console.log(`✅ Anuncios de prueba: ${adsCount[0].count}`);

    // 4. Insertar en content_feed manualmente
    console.log('4️⃣ Insertando anuncios en content_feed...');
    await connection.execute(`
      INSERT INTO content_feed (
        titulo, descripcion, image_url, type, original_id, user_id, user_name, 
        published_at, resumen, original_url, is_oficial, video_url, likes_count, comments_count
      )
      SELECT 
        a.titulo, a.descripcion, a.image_url, 3, a.id, a.created_by, 
        (SELECT nombre FROM users WHERE id = a.created_by), a.created_at, 
        a.texto_opcional, a.enlace_destino, TRUE, NULL, 0, 0
      FROM ads a
      WHERE a.activo = TRUE
    `);
    console.log('✅ Anuncios insertados en content_feed\n');

    // Verificar content_feed
    const [feedAdsCount] = await connection.execute('SELECT COUNT(*) as count FROM content_feed WHERE type = 3');
    console.log(`✅ Anuncios en content_feed: ${feedAdsCount[0].count}`);

    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Tabla ads creada');
    console.log('- ✅ Datos de prueba insertados');
    console.log('- ✅ Integración con content_feed funcionando');
    console.log('- ⚠️ Triggers: Se implementarán en la siguiente versión');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Sugerencia: Verifica las credenciales de la base de datos');
      console.log('   - DB_USER: ' + (process.env.DB_USER || 'root'));
      console.log('   - DB_PASSWORD: ' + (process.env.DB_PASSWORD ? '***' : 'vacío'));
      console.log('   - DB_NAME: ' + (process.env.DB_NAME || 'trigamer_diario'));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencia: Verifica que MySQL esté ejecutándose');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar configuración
setupAdsDatabase(); 