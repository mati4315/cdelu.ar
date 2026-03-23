const mysql = require('mysql2/promise');

/**
 * Script para verificar si los anuncios están en content_feed
 */
async function checkAdsInFeed() {
  console.log('🔍 Verificando anuncios en content_feed...\n');

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

    // Verificar anuncios en tabla ads
    console.log('1️⃣ Verificando tabla ads...');
    const [adsResult] = await connection.execute('SELECT id, titulo, activo FROM ads');
    console.log(`📊 Anuncios en tabla ads: ${adsResult.length}`);
    adsResult.forEach(ad => {
      console.log(`   - ID: ${ad.id}, Título: ${ad.titulo}, Activo: ${ad.activo}`);
    });
    console.log('');

    // Verificar anuncios en content_feed
    console.log('2️⃣ Verificando content_feed...');
    const [feedResult] = await connection.execute('SELECT id, titulo, type, is_oficial FROM content_feed WHERE type = 3');
    console.log(`📊 Anuncios en content_feed: ${feedResult.length}`);
    feedResult.forEach(item => {
      console.log(`   - ID: ${item.id}, Título: ${item.titulo}, Type: ${item.type}, Oficial: ${item.is_oficial}`);
    });
    console.log('');

    // Verificar todos los tipos en content_feed
    console.log('3️⃣ Verificando todos los tipos en content_feed...');
    const [allTypes] = await connection.execute('SELECT type, COUNT(*) as count FROM content_feed GROUP BY type');
    console.log('📊 Distribución por tipo:');
    allTypes.forEach(type => {
      const typeName = type.type === 1 ? 'Noticias' : type.type === 2 ? 'Comunidad' : type.type === 3 ? 'Anuncios' : 'Desconocido';
      console.log(`   - Type ${type.type} (${typeName}): ${type.count}`);
    });
    console.log('');

    // Verificar si hay anuncios activos en content_feed
    console.log('4️⃣ Verificando anuncios activos en content_feed...');
    const [activeAds] = await connection.execute(`
      SELECT cf.id, cf.titulo, cf.is_oficial 
      FROM content_feed cf 
      WHERE cf.type = 3 AND cf.is_oficial = TRUE
    `);
    console.log(`📊 Anuncios activos en content_feed: ${activeAds.length}`);
    activeAds.forEach(ad => {
      console.log(`   - ID: ${ad.id}, Título: ${ad.titulo}, Oficial: ${ad.is_oficial}`);
    });

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar verificación
checkAdsInFeed(); 