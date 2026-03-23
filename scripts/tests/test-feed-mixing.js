const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Script para probar específicamente la mezcla de anuncios en el feed
 */
async function testFeedMixing() {
  console.log('🧪 Probando mezcla de anuncios en el feed...\n');

  try {
    // 1. Probar feed SIN publicidad
    console.log('1️⃣ Probando feed SIN publicidad...');
    const feedWithoutAds = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=false&limit=10`);
    console.log(`📊 Elementos sin publicidad: ${feedWithoutAds.data.data.length}`);
    
    const typesWithoutAds = feedWithoutAds.data.data.reduce((acc, item) => {
      if (item.type === 1) acc.news++;
      else if (item.type === 2) acc.community++;
      else if (item.type === 3) acc.ads++;
      return acc;
    }, { news: 0, community: 0, ads: 0 });
    
    console.log(`📰 Noticias: ${typesWithoutAds.news}`);
    console.log(`👥 Comunidad: ${typesWithoutAds.community}`);
    console.log(`📢 Anuncios: ${typesWithoutAds.ads}`);
    console.log('');

    // 2. Probar feed CON publicidad
    console.log('2️⃣ Probando feed CON publicidad...');
    const feedWithAds = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=true&limit=10`);
    console.log(`📊 Elementos con publicidad: ${feedWithAds.data.data.length}`);
    
    const typesWithAds = feedWithAds.data.data.reduce((acc, item) => {
      if (item.type === 1) acc.news++;
      else if (item.type === 2) acc.community++;
      else if (item.type === 3) acc.ads++;
      return acc;
    }, { news: 0, community: 0, ads: 0 });
    
    console.log(`📰 Noticias: ${typesWithAds.news}`);
    console.log(`👥 Comunidad: ${typesWithAds.community}`);
    console.log(`📢 Anuncios: ${typesWithAds.ads}`);
    console.log('');

    // 3. Verificar si hay diferencias
    console.log('3️⃣ Comparando resultados...');
    const newsDiff = typesWithAds.news - typesWithoutAds.news;
    const communityDiff = typesWithAds.community - typesWithoutAds.community;
    const adsDiff = typesWithAds.ads - typesWithoutAds.ads;
    
    console.log(`📊 Diferencias:`);
    console.log(`   - Noticias: ${newsDiff > 0 ? '+' : ''}${newsDiff}`);
    console.log(`   - Comunidad: ${communityDiff > 0 ? '+' : ''}${communityDiff}`);
    console.log(`   - Anuncios: ${adsDiff > 0 ? '+' : ''}${adsDiff}`);
    console.log('');

    // 4. Mostrar estructura de los anuncios en el feed
    console.log('4️⃣ Estructura de anuncios en el feed...');
    const adsInFeed = feedWithAds.data.data.filter(item => item.type === 3);
    console.log(`📢 Anuncios encontrados: ${adsInFeed.length}`);
    
    adsInFeed.forEach((ad, index) => {
      console.log(`   ${index + 1}. ID: ${ad.id}, Título: ${ad.titulo}`);
      console.log(`      - is_ad: ${ad.is_ad || false}`);
      console.log(`      - is_oficial: ${ad.is_oficial}`);
      console.log(`      - enlace_destino: ${ad.original_url}`);
    });

    // 5. Verificar parámetro includeAds
    console.log('5️⃣ Verificando parámetro includeAds...');
    console.log(`📋 Parámetro includeAds recibido: ${feedWithAds.config.params.includeAds}`);
    console.log(`📋 Tipo de parámetro: ${typeof feedWithAds.config.params.includeAds}`);

    if (adsDiff > 0) {
      console.log('\n✅ ¡La mezcla de anuncios está funcionando!');
    } else {
      console.log('\n❌ La mezcla de anuncios no está funcionando correctamente');
      console.log('💡 Posibles causas:');
      console.log('   - Los anuncios no están siendo detectados como activos');
      console.log('   - La función de mezcla no está insertando anuncios');
      console.log('   - El parámetro includeAds no se está procesando correctamente');
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    
    if (error.response) {
      console.log('📊 Respuesta del servidor:', error.response.status);
      console.log('📋 Datos:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testFeedMixing(); 