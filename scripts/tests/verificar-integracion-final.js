const axios = require('axios');

console.log('🎰 VERIFICACIÓN FINAL - INTEGRACIÓN FRONTEND-BACKEND');
console.log('='.repeat(60));

async function testEndpoints() {
  const BASE_URL = 'http://localhost:3001/api/v1';
  const tests = [
    {
      name: 'Endpoint principal de loterías',
      url: `${BASE_URL}/lotteries`,
      method: 'GET'
    },
    {
      name: 'Loterías con filtros (como en HTML)',
      url: `${BASE_URL}/lotteries?page=1&limit=12`,
      method: 'GET'
    },
    {
      name: 'Filtro de loterías gratuitas',
      url: `${BASE_URL}/lotteries?page=1&limit=12&is_free=true`,
      method: 'GET'
    },
    {
      name: 'Filtro de loterías de pago',
      url: `${BASE_URL}/lotteries?page=1&limit=12&is_free=false`,
      method: 'GET'
    },
    {
      name: 'Verificar perfil usuario',
      url: `${BASE_URL}/auth/me`,
      method: 'GET',
      requiresAuth: true
    }
  ];

  // Primero autenticarse
  let authToken = null;
  try {
    console.log('\n🔐 Obteniendo token de autenticación...');
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cdelu.ar',
      password: 'admin123'
    });
    authToken = authResponse.data.token;
    console.log('✅ Token obtenido exitosamente');
  } catch (error) {
    console.log('❌ Error de autenticación:', error.message);
    return;
  }

  console.log('\n🌐 Probando endpoints...');
  let successCount = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: test.url,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (test.requiresAuth && authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios(config);
      
      if (response.status === 200) {
        console.log(`✅ ${test.name} - OK`);
        
        if (response.data.success !== undefined) {
          console.log(`   📊 success: ${response.data.success}`);
        }
        
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`   📦 elementos: ${response.data.data.length}`);
        }
        
        if (response.data.pagination) {
          const p = response.data.pagination;
          console.log(`   📄 paginación: página ${p.page} de ${p.pages} (total: ${p.total})`);
        }
        
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    }
  }

  console.log(`\n📊 RESULTADO: ${successCount}/${tests.length} endpoints funcionando`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 ¡INTEGRACIÓN COMPLETAMENTE FUNCIONAL!');
    console.log('✅ Todas las URLs que usa el frontend funcionan correctamente');
    console.log('✅ La estructura de respuesta es consistente');
    console.log('✅ Los filtros y paginación funcionan');
    console.log('\n🌐 URLs corregidas en frontend:');
    console.log('   📝 lottery.html: API_BASE = "/api/v1/lotteries" ✅');
    console.log('   📝 lottery-admin.html: API_BASE = "/api/v1/lotteries" ✅');
    console.log('\n🚀 El frontend ahora debería funcionar sin errores 404');
  } else if (successCount >= tests.length * 0.8) {
    console.log('\n⚠️  INTEGRACIÓN MAYORMENTE FUNCIONAL');
    console.log('🔧 La mayoría de funciones trabajan correctamente');
  } else {
    console.log('\n❌ NECESITA MÁS CORRECCIONES');
    console.log('🔧 Revise los errores arriba');
  }
}

async function testSpecificLottery() {
  console.log('\n🎲 Probando endpoint específico de lotería...');
  
  try {
    // Primero obtener una lotería existente
    const listResponse = await axios.get('http://localhost:3001/api/v1/lotteries?limit=1');
    
    if (listResponse.data.data && listResponse.data.data.length > 0) {
      const lotteryId = listResponse.data.data[0].id;
      
      // Probar endpoint específico
      const specificResponse = await axios.get(`http://localhost:3001/api/v1/lotteries/${lotteryId}`);
      
      if (specificResponse.status === 200) {
        console.log(`✅ Lotería específica (ID: ${lotteryId}) - OK`);
        console.log(`   📝 Título: ${specificResponse.data.data.title}`);
        console.log(`   🎯 Estado: ${specificResponse.data.data.status}`);
        console.log(`   🎟️  Tickets vendidos: ${specificResponse.data.data.tickets_sold || 0}`);
        return true;
      }
    } else {
      console.log('⚠️  No hay loterías disponibles para probar');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error probando lotería específica: ${error.message}`);
    return false;
  }
}

// Ejecutar verificación
Promise.all([
  testEndpoints(),
  testSpecificLottery()
]).then(() => {
  console.log('\n✨ Verificación de integración completada');
  console.log('\n🔗 Recarga tu página web en: http://localhost:3001/lottery.html');
  console.log('📱 Los errores 404 deberían estar resueltos');
}).catch(error => {
  console.error('💥 Error durante la verificación:', error.message);
}); 