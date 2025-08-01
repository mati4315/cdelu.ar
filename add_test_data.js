const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script para agregar datos de prueba
 * Uso: node add_test_data.js
 */
async function addTestData() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  };

  let pool;
  try {
    // Crear pool de conexión
    pool = mysql.createPool(config);
    
    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    connection.release();

    // Obtener el ID del usuario administrador
    const [adminUsers] = await pool.query(
      'SELECT id FROM users WHERE rol = "administrador" LIMIT 1'
    );

    if (adminUsers.length === 0) {
      console.log('❌ No se encontró ningún usuario administrador');
      console.log('Ejecuta primero: node create_admin_user.js');
      return;
    }

    const adminId = adminUsers[0].id;
    console.log(`👤 Usando usuario administrador ID: ${adminId}`);

    // Agregar noticias de prueba
    console.log('📰 Agregando noticias de prueba...');
    await pool.query(`
      INSERT INTO news (titulo, descripcion, resumen, image_url, original_url, is_oficial, published_at, created_by) VALUES 
      ('Noticia de Prueba 1', 'Esta es la primera noticia de prueba para verificar el dashboard.', 'Resumen de la primera noticia', 'https://ejemplo.com/imagen1.jpg', 'https://fuente.com/noticia1', TRUE, NOW(), ?),
      ('Noticia de Prueba 2', 'Segunda noticia de prueba con contenido interesante.', 'Resumen de la segunda noticia', 'https://ejemplo.com/imagen2.jpg', 'https://fuente.com/noticia2', FALSE, NOW(), ?),
      ('Noticia de Prueba 3', 'Tercera noticia para completar el conjunto de datos.', 'Resumen de la tercera noticia', 'https://ejemplo.com/imagen3.jpg', 'https://fuente.com/noticia3', TRUE, NOW(), ?)
    `, [adminId, adminId, adminId]);

    // Agregar contenido de comunidad de prueba
    console.log('💬 Agregando contenido de comunidad...');
    await pool.query(`
      INSERT INTO com (titulo, descripcion, image_url, video_url, user_id) VALUES 
      ('Post de Comunidad 1', 'Primer post de la comunidad para probar el sistema.', 'https://ejemplo.com/com1.jpg', 'https://video.com/video1', ?),
      ('Post de Comunidad 2', 'Segundo post con contenido multimedia.', 'https://ejemplo.com/com2.jpg', 'https://video.com/video2', ?)
    `, [adminId, adminId]);

    // Agregar comentarios de prueba
    console.log('💭 Agregando comentarios...');
    await pool.query(`
      INSERT INTO comments (user_id, news_id, content) VALUES 
      (?, 1, 'Excelente noticia, muy informativa.'),
      (?, 1, 'Gracias por compartir esta información.'),
      (?, 2, 'Interesante punto de vista.'),
      (?, 3, 'Muy útil esta noticia.')
    `, [adminId, adminId, adminId, adminId]);

    // Agregar comentarios de comunidad
    await pool.query(`
      INSERT INTO com_comments (user_id, com_id, content) VALUES 
      (?, 1, 'Muy buen post de la comunidad.'),
      (?, 1, 'Comparto tu opinión.'),
      (?, 2, 'Excelente contenido multimedia.')
    `, [adminId, adminId, adminId]);

    // Agregar likes de prueba
    console.log('👍 Agregando likes...');
    await pool.query(`
      INSERT INTO likes (user_id, news_id) VALUES 
      (?, 1),
      (?, 2),
      (?, 3)
    `, [adminId, adminId, adminId]);

    await pool.query(`
      INSERT INTO com_likes (user_id, com_id) VALUES 
      (?, 1),
      (?, 2)
    `, [adminId, adminId]);

    console.log('✅ Datos de prueba agregados exitosamente');
    console.log('📊 Ahora el dashboard debería mostrar:');
    console.log('   - 3 noticias');
    console.log('   - 2 posts de comunidad');
    console.log('   - 4 comentarios en noticias');
    console.log('   - 3 comentarios en comunidad');
    console.log('   - 5 likes totales');

  } catch (error) {
    console.error('❌ Error al agregar datos de prueba:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('❌ Las tablas no existen. Ejecuta primero el script de creación de tablas.');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.error('❌ Algunos datos ya existen. Los datos de prueba ya fueron agregados.');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar el script
addTestData()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 