const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Script de prueba simple para el sistema de publicidad
 */
async function testSimpleAds() {
  console.log('🚀 Prueba simple del sistema de publicidad...\n');

  try {
    // 1. Probar health check
    console.log('1️⃣ Probando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // 2. Probar endpoint de anuncios activos
    console.log('2️⃣ Probando endpoint de anuncios activos...');
    const activeAdsResponse = await axios.get(`${BASE_URL}/api/v1/ads/active`);
    console.log('✅ Anuncios activos obtenidos');
    console.log(`📊 Total de anuncios: ${activeAdsResponse.data.total}`);
    console.log('📋 Datos:', activeAdsResponse.data.data);
    console.log('');

    // 3. Probar feed con publicidad
    console.log('3️⃣ Probando feed con publicidad...');
    const feedWithAdsResponse = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=true&limit=5`);
    console.log('✅ Feed con publicidad obtenido');
    console.log(`📊 Total de elementos: ${feedWithAdsResponse.data.data.length}`);
    
    // Contar tipos de contenido
    const contentTypes = feedWithAdsResponse.data.data.reduce((acc, item) => {
      if (item.is_ad) {
        acc.ads++;
      } else if (item.type === 1) {
        acc.news++;
      } else if (item.type === 2) {
        acc.community++;
      }
      return acc;
    }, { ads: 0, news: 0, community: 0 });
    
    console.log(`📰 Noticias: ${contentTypes.news}`);
    console.log(`👥 Comunidad: ${contentTypes.community}`);
    console.log(`📢 Anuncios: ${contentTypes.ads}`);
    console.log('');

    console.log('🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor no está ejecutándose en http://localhost:3001');
      console.log('   Ejecuta: node src/index.js');
    }
    
    if (error.response) {
      console.log('📊 Respuesta del servidor:', error.response.status);
      console.log('📋 Datos:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testSimpleAds(); 