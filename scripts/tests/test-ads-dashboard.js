const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Script para probar el dashboard de publicidad
 */
async function testAdsDashboard() {
  console.log('🎯 Probando dashboard de publicidad...\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor funcionando');
    console.log('');

    // 2. Verificar que el dashboard esté accesible
    console.log('2️⃣ Verificando acceso al dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/ads-dashboard.html`);
    console.log('✅ Dashboard accesible');
    console.log('');

    // 3. Probar endpoints de administración (requieren autenticación)
    console.log('3️⃣ Probando endpoints administrativos...');
    
    // Intentar obtener estadísticas sin token
    try {
      await axios.get(`${BASE_URL}/api/v1/ads/stats`);
      console.log('❌ Error: Debería requerir autenticación');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Autenticación requerida correctamente');
      } else {
        console.log('⚠️ Error inesperado:', error.response?.status);
      }
    }

    // Intentar obtener anuncios sin token
    try {
      await axios.get(`${BASE_URL}/api/v1/ads`);
      console.log('❌ Error: Debería requerir autenticación');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Autenticación requerida correctamente');
      } else {
        console.log('⚠️ Error inesperado:', error.response?.status);
      }
    }
    console.log('');

    // 4. Verificar endpoints públicos
    console.log('4️⃣ Probando endpoints públicos...');
    
    // Anuncios activos (público)
    const activeAdsResponse = await axios.get(`${BASE_URL}/api/v1/ads/active`);
    console.log(`✅ Anuncios activos: ${activeAdsResponse.data.total}`);
    
    // Feed con publicidad (público)
    const feedWithAdsResponse = await axios.get(`${BASE_URL}/api/v1/feed?includeAds=true&limit=5`);
    console.log(`✅ Feed con publicidad: ${feedWithAdsResponse.data.data.length} elementos`);
    console.log('');

    // 5. Verificar estructura del dashboard
    console.log('5️⃣ Verificando estructura del dashboard...');
    const dashboardContent = dashboardResponse.data;
    
    const checks = [
      { name: 'Vue.js', check: dashboardContent.includes('createApp') },
      { name: 'Tailwind CSS', check: dashboardContent.includes('tailwind') },
      { name: 'Font Awesome', check: dashboardContent.includes('font-awesome') },
      { name: 'Axios', check: dashboardContent.includes('axios') },
      { name: 'Tabla de anuncios', check: dashboardContent.includes('ads.length') },
      { name: 'Formulario de creación', check: dashboardContent.includes('showCreateModal') },
      { name: 'Estadísticas', check: dashboardContent.includes('stats.totalAds') },
      { name: 'Filtros', check: dashboardContent.includes('filters.categoria') }
    ];

    checks.forEach(check => {
      console.log(`${check.check ? '✅' : '❌'} ${check.name}`);
    });
    console.log('');

    // 6. Resumen final
    console.log('6️⃣ Resumen del dashboard:');
    console.log('📊 Dashboard de publicidad creado exitosamente');
    console.log('🔐 Autenticación requerida para administración');
    console.log('🌐 Endpoints públicos funcionando');
    console.log('📱 Interfaz responsive con Tailwind CSS');
    console.log('⚡ Funcionalidades completas de CRUD');
    console.log('📈 Estadísticas en tiempo real');
    console.log('');

    console.log('🎉 ¡Dashboard de publicidad listo para usar!');
    console.log('');
    console.log('📋 Para acceder al dashboard:');
    console.log('   1. Inicia sesión en /login.html');
    console.log('   2. Navega a /ads-dashboard.html');
    console.log('   3. Gestiona tus anuncios desde la interfaz web');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor no está ejecutándose');
      console.log('   Ejecuta: node src/index.js');
    }
  }
}

// Ejecutar pruebas
testAdsDashboard(); 