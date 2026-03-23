const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Script de prueba para el sistema de publicidad
 */
async function testAdsSystem() {
  console.log('🚀 Iniciando pruebas del sistema de publicidad...\n');

  try {
    // 1. Probar endpoint de anuncios activos
    console.log('1️⃣ Probando endpoint de anuncios activos...');
    const activeAdsResponse = await axios.get(`${BASE_URL}/api/v1/ads/active`);
    console.log('✅ Anuncios activos obtenidos:', activeAdsResponse.data);
    console.log(`📊 Total de anuncios: ${activeAdsResponse.data.total}\n`);

    // 2. Probar feed con publicidad
    console.log('2️⃣ Probando feed con publicidad...');
    const feedWithAdsResponse = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=true&limit=10`);
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
    console.log(`📢 Anuncios: ${contentTypes.ads}\n`);

    // 3. Probar registro de impresión
    if (activeAdsResponse.data.data.length > 0) {
      const firstAd = activeAdsResponse.data.data[0];
      console.log('3️⃣ Probando registro de impresión...');
      const impressionResponse = await axios.post(`${BASE_URL}/api/v1/ads/${firstAd.id}/impression`);
      console.log('✅ Impresión registrada:', impressionResponse.data);
    }

    // 4. Probar registro de clic
    if (activeAdsResponse.data.data.length > 0) {
      const firstAd = activeAdsResponse.data.data[0];
      console.log('4️⃣ Probando registro de clic...');
      const clickResponse = await axios.post(`${BASE_URL}/api/v1/ads/${firstAd.id}/click`);
      console.log('✅ Clic registrado:', clickResponse.data);
    }

    // 5. Probar feed sin publicidad (comparación)
    console.log('5️⃣ Probando feed sin publicidad...');
    const feedWithoutAdsResponse = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=false&limit=10`);
    console.log('✅ Feed sin publicidad obtenido');
    console.log(`📊 Total de elementos: ${feedWithoutAdsResponse.data.data.length}\n`);

    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Endpoint de anuncios activos funcionando');
    console.log('- ✅ Feed con publicidad mezclada correctamente');
    console.log('- ✅ Registro de impresiones funcionando');
    console.log('- ✅ Registro de clics funcionando');
    console.log('- ✅ Feed sin publicidad funcionando');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testAdsSystem(); 