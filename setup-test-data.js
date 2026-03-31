const mysql = require('mysql2/promise');

/**
 * Script para insertar datos de prueba en la BD trigamer_diario
 * Esto permite al frontend tener contenido para mostrar
 */

async function setupTestData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'w35115415',
    database: 'trigamer_diario',
    charset: 'utf8mb4'
  });

  try {
    console.log('📝 Insertando datos de prueba...\n');

    // 1. Agregar noticias de prueba
    console.log('📰 Agregando noticias...');
    await conn.execute(`
      INSERT INTO news (titulo, descripcion, image_url, diario, categoria, is_oficial, created_at, updated_at) VALUES
      ('Noticia de Prueba 1', 'Esta es una noticia de prueba para verificar que el sistema funciona correctamente.', null, 'CdelU', 'General', 1, NOW(), NOW()),
      ('Noticia de Prueba 2', 'Segunda noticia para ver cómo se muestra el feed con múltiples elementos.', null, 'CdelU', 'Política', 1, NOW(), NOW()),
      ('Noticia de Prueba 3', 'Una tercera noticia sobre eventos locales en Concepción del Uruguay.', null, 'CdelU', 'Eventos', 1, NOW(), NOW())
    `);
    console.log('   ✅ 3 noticias agregadas\n');

    // 2. Agregar contenido al feed
    console.log('🔄 Sincronizando noticias a content_feed...');
    await conn.execute(`
      INSERT INTO content_feed (titulo, descripcion, image_url, type, original_id, user_name, published_at, created_at, updated_at, is_oficial, likes_count, comments_count)
      SELECT titulo, descripcion, image_url, 1, id, 'CdelU', NOW(), NOW(), NOW(), is_oficial, 0, 0
      FROM news
      WHERE id NOT IN (SELECT original_id FROM content_feed WHERE type = 1)
      LIMIT 10
    `);
    console.log('   ✅ Noticias sincronizadas a content_feed\n');

    // 3. Verificar datos
    const [newsCount] = await conn.execute('SELECT COUNT(*) as total FROM news');
    const [feedCount] = await conn.execute('SELECT COUNT(*) as total FROM content_feed');
    
    console.log('📊 Resumen de datos:');
    console.log(`   📰 Noticias en tabla "news": ${newsCount[0].total}`);
    console.log(`   📄 Elementos en tabla "content_feed": ${feedCount[0].total}`);
    console.log('');

    console.log('✅ Datos de prueba agregados exitosamente');
    console.log('');
    console.log('🌐 Ahora puedes ver contenido en:');
    console.log('   http://localhost:5173/');
    console.log('   http://localhost:3001/api/v1/feed');
    

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    conn.end();
  }
}

// Ejecutar
setupTestData();
