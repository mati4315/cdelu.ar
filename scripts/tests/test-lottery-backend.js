const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@cdelu.ar',
  password: 'admin123'
};

console.log('🎰 VERIFICACIÓN COMPLETA DEL SISTEMA DE LOTERÍA');
console.log('='.repeat(60));

async function testDatabaseConnection() {
  console.log('\n1. 🔌 Verificando conexión a la base de datos...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cdelu_ar'
    });

    // Verificar que las tablas de lotería existen
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'lottery%'
    `, [process.env.DB_NAME || 'cdelu_ar']);

    console.log('✅ Conexión a la base de datos exitosa');
    console.log(`📋 Tablas de lotería encontradas: ${tables.length}`);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    const expectedTables = ['lotteries', 'lottery_tickets', 'lottery_winners', 'lottery_reserved_numbers', 'lottery_settings'];
    
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table} - OK`);
      } else {
        console.log(`   ❌ ${table} - FALTANTE`);
      }
    }

    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ Error de base de datos: ${error.message}`);
    return false;
  }
}

async function testBackendConnection() {
  console.log('\n2. 🌐 Verificando backend...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/lotteries`);
    console.log('✅ Backend respondiendo correctamente');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Loterías encontradas: ${response.data.data?.length || 0}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend no está ejecutándose en puerto 3001');
      console.log('💡 Ejecute: node src/app.js o npm start');
    } else {
      console.log(`❌ Error del backend: ${error.message}`);
    }
    return false;
  }
}

async function testAuthentication() {
  console.log('\n3. 🔐 Verificando autenticación...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, TEST_USER);
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Autenticación exitosa');
      console.log(`👤 Usuario: ${response.data.user?.nombre || 'N/A'}`);
      console.log(`🎭 Rol: ${response.data.user?.rol || 'N/A'}`);
      return response.data.token;
    } else {
      console.log('❌ Login fallido - respuesta inesperada');
      return null;
    }
  } catch (error) {
    console.log(`❌ Error de autenticación: ${error.response?.data?.error || error.message}`);
    console.log('💡 Verifique que existe un usuario administrador con email "admin@cdelu.ar"');
    return null;
  }
}

async function testLotteryEndpoints(token) {
  console.log('\n4. 🎲 Verificando endpoints de lotería...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { method: 'GET', url: '/api/v1/lotteries', description: 'Listar loterías' },
    { method: 'GET', url: '/api/v1/lotteries?is_free=true', description: 'Filtrar loterías gratuitas' },
    { method: 'GET', url: '/api/v1/lotteries?status=active', description: 'Filtrar loterías activas' }
  ];

  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: endpoint.method !== 'GET' ? headers : undefined
      });
      
      console.log(`   ✅ ${endpoint.description} - Status: ${response.status}`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ ${endpoint.description} - Error: ${error.response?.status || error.message}`);
    }
  }

  console.log(`📊 Endpoints funcionando: ${successCount}/${endpoints.length}`);
  return successCount === endpoints.length;
}

async function testLotteryCreation(token) {
  console.log('\n5. 🆕 Probando creación de lotería...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const testLottery = {
    title: 'Lotería de Prueba - ' + new Date().toISOString(),
    description: 'Lotería creada automáticamente para verificar el sistema',
    is_free: true,
    ticket_price: 0,
    min_tickets: 1,
    max_tickets: 100,
    num_winners: 3,
    start_date: new Date(Date.now() + 60000).toISOString(), // 1 minuto en el futuro
    end_date: new Date(Date.now() + 86400000).toISOString(), // 24 horas en el futuro
    prize_description: 'Premios de prueba',
    terms_conditions: 'Términos y condiciones de prueba'
  };

  try {
    const response = await axios.post(`${BASE_URL}/api/v1/lotteries`, testLottery, { headers });
    
    if (response.status === 201) {
      console.log('✅ Creación de lotería exitosa');
      console.log(`🆔 ID: ${response.data.data?.id}`);
      console.log(`📝 Título: ${response.data.data?.title}`);
      console.log(`⚡ Estado: ${response.data.data?.status}`);
      
      // Limpiar - eliminar lotería de prueba
      try {
        await axios.delete(`${BASE_URL}/api/v1/lotteries/${response.data.data.id}`, { headers });
        console.log('🧹 Lotería de prueba eliminada');
      } catch (e) {
        console.log('⚠️  No se pudo eliminar la lotería de prueba (normal si no hay endpoint DELETE)');
      }
      
      return true;
    }
  } catch (error) {
    console.log(`❌ Error al crear lotería: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 403) {
      console.log('💡 Verifique que el usuario tenga rol "administrador"');
    }
  }
  
  return false;
}

async function testLotteryFilters() {
  console.log('\n6. 🔍 Probando filtros y paginación...');
  
  const filterTests = [
    { query: '?page=1&limit=5', description: 'Paginación básica' },
    { query: '?is_free=true', description: 'Filtro loterías gratuitas' },
    { query: '?is_free=false', description: 'Filtro loterías de pago' },
    { query: '?status=active', description: 'Filtro estado activo' },
    { query: '?status=draft', description: 'Filtro estado borrador' }
  ];

  let successCount = 0;
  
  for (const test of filterTests) {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/lotteries${test.query}`);
      
      if (response.status === 200 && response.data.success) {
        console.log(`   ✅ ${test.description} - OK`);
        successCount++;
      } else {
        console.log(`   ❌ ${test.description} - Respuesta inesperada`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.description} - Error: ${error.response?.status || error.message}`);
    }
  }

  console.log(`📊 Filtros funcionando: ${successCount}/${filterTests.length}`);
  return successCount >= filterTests.length * 0.8; // 80% de éxito
}

async function generateReport() {
  console.log('\n📋 RESUMEN DE LA VERIFICACIÓN');
  console.log('='.repeat(60));
  
  const dbOk = await testDatabaseConnection();
  const backendOk = await testBackendConnection();
  
  if (!backendOk) {
    console.log('\n❌ BACKEND NO DISPONIBLE');
    console.log('💡 Acciones requeridas:');
    console.log('   1. Asegúrese de que el backend esté ejecutándose: node src/app.js');
    console.log('   2. Verifique que el puerto 3001 esté disponible');
    console.log('   3. Revise la configuración de la base de datos');
    return;
  }
  
  const token = await testAuthentication();
  if (!token) {
    console.log('\n❌ AUTENTICACIÓN FALLIDA');
    console.log('💡 Acciones requeridas:');
    console.log('   1. Crear usuario administrador: node create-admin-user.js');
    console.log('   2. Verificar credenciales en el script');
    return;
  }
  
  const endpointsOk = await testLotteryEndpoints(token);
  const creationOk = await testLotteryCreation(token);
  const filtersOk = await testLotteryFilters();
  
  console.log('\n🎯 ESTADO FINAL:');
  console.log(`   Base de datos: ${dbOk ? '✅' : '❌'}`);
  console.log(`   Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`   Autenticación: ${token ? '✅' : '❌'}`);
  console.log(`   Endpoints: ${endpointsOk ? '✅' : '❌'}`);
  console.log(`   Creación: ${creationOk ? '✅' : '❌'}`);
  console.log(`   Filtros: ${filtersOk ? '✅' : '❌'}`);
  
  const allOk = dbOk && backendOk && token && endpointsOk && creationOk && filtersOk;
  
  if (allOk) {
    console.log('\n🎉 ¡SISTEMA DE LOTERÍA COMPLETAMENTE FUNCIONAL!');
    console.log('✅ El backend está listo para trabajar con el frontend');
    console.log('🚀 URLs importantes:');
    console.log(`   📡 API Base: ${BASE_URL}/api/v1/lotteries`);
    console.log('   📖 Documentación: http://localhost:3001/docs');
    console.log('   🎯 Frontend esperado en: http://localhost:5173');
  } else {
    console.log('\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL');
    console.log('💡 Revise los errores arriba y corrija los problemas marcados con ❌');
  }
}

// Ejecutar verificación
generateReport().catch(error => {
  console.error('\n💥 Error durante la verificación:', error.message);
  process.exit(1);
}); 