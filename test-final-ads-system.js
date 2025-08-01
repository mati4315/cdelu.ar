const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Script de prueba final del sistema de publicidad
 */
async function testFinalAdsSystem() {
  console.log('🎯 Prueba final del sistema de publicidad...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor funcionando');
    console.log('');

    // 2. Anuncios activos
    console.log('2️⃣ Anuncios activos...');
    const activeAdsResponse = await axios.get(`${BASE_URL}/api/v1/ads/active`);
    console.log(`✅ ${activeAdsResponse.data.total} anuncios activos`);
    console.log('');

    // 3. Feed sin publicidad
    console.log('3️⃣ Feed sin publicidad...');
    const feedWithoutAds = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=false&limit=10`);
    const typesWithoutAds = feedWithoutAds.data.data.reduce((acc, item) => {
      if (item.type === 1) acc.news++;
      else if (item.type === 2) acc.community++;
      else if (item.type === 3) acc.ads++;
      return acc;
    }, { news: 0, community: 0, ads: 0 });
    
    console.log(`📊 Elementos: ${feedWithoutAds.data.data.length}`);
    console.log(`📰 Noticias: ${typesWithoutAds.news}`);
    console.log(`👥 Comunidad: ${typesWithoutAds.community}`);
    console.log(`📢 Anuncios: ${typesWithoutAds.ads}`);
    console.log('');

    // 4. Feed con publicidad
    console.log('4️⃣ Feed con publicidad...');
    const feedWithAds = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=true&limit=10`);
    const typesWithAds = feedWithAds.data.data.reduce((acc, item) => {
      if (item.type === 1) acc.news++;
      else if (item.type === 2) acc.community++;
      else if (item.type === 3) acc.ads++;
      return acc;
    }, { news: 0, community: 0, ads: 0 });
    
    console.log(`📊 Elementos: ${feedWithAds.data.data.length}`);
    console.log(`📰 Noticias: ${typesWithAds.news}`);
    console.log(`👥 Comunidad: ${typesWithAds.community}`);
    console.log(`📢 Anuncios: ${typesWithAds.ads}`);
    console.log('');

    // 5. Verificar anuncios mezclados
    console.log('5️⃣ Verificando anuncios mezclados...');
    const adsInFeed = feedWithAds.data.data.filter(item => item.type === 3);
    const originalAds = adsInFeed.filter(ad => !ad.is_ad);
    const mixedAds = adsInFeed.filter(ad => ad.is_ad);
    
    console.log(`📢 Anuncios totales: ${adsInFeed.length}`);
    console.log(`📢 Anuncios originales: ${originalAds.length}`);
    console.log(`📢 Anuncios mezclados: ${mixedAds.length}`);
    console.log('');

    // 6. Mostrar detalles de anuncios mezclados
    if (mixedAds.length > 0) {
      console.log('6️⃣ Detalles de anuncios mezclados:');
      mixedAds.forEach((ad, index) => {
        console.log(`   ${index + 1}. ${ad.titulo}`);
        console.log(`      - ID: ${ad.id}`);
        console.log(`      - is_ad: ${ad.is_ad}`);
        console.log(`      - enlace: ${ad.original_url}`);
      });
    } else {
      console.log('6️⃣ No se encontraron anuncios mezclados');
    }
    console.log('');

    // 7. Resumen final
    console.log('7️⃣ Resumen final:');
    const adsDiff = typesWithAds.ads - typesWithoutAds.ads;
    
    if (adsDiff > 0) {
      console.log('✅ ¡Sistema de publicidad funcionando correctamente!');
      console.log(`📈 Se agregaron ${adsDiff} anuncios al feed`);
      console.log(`🎯 Mezcla inteligente activa`);
    } else {
      console.log('❌ Sistema de publicidad no está mezclando anuncios');
    }

    console.log('\n🎉 Prueba final completada!');

  } catch (error) {
    console.error('❌ Error en la prueba final:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor no está ejecutándose');
      console.log('   Ejecuta: node src/index.js');
    }
  }
}

// Ejecutar prueba final
testFinalAdsSystem(); 