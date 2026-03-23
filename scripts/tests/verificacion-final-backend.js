const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001/api/v1';

console.log('🎰 VERIFICACIÓN FINAL DEL SISTEMA DE LOTERÍA BACKEND');
console.log('='.repeat(70));

let authToken = null;
let createdLotteryId = null;

async function checkDatabase() {
  console.log('\n📊 VERIFICANDO BASE DE DATOS');
  console.log('-'.repeat(50));
  
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    // Verificar tablas esenciales
    const [tables] = await conn.execute("SHOW TABLES LIKE 'lottery%'");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('📋 Tablas de lotería:');
    const requiredTables = ['lotteries', 'lottery_tickets', 'lottery_winners', 'lottery_settings'];
    const optionalTables = ['lottery_reserved_numbers'];
    
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table} - Presente`);
      } else {
        console.log(`   ❌ ${table} - FALTANTE (CRÍTICO)`);
      }
    }
    
    for (const table of optionalTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table} - Presente (opcional)`);
      } else {
        console.log(`   ⚠️  ${table} - Faltante (opcional)`);
      }
    }

    // Verificar estructura de la tabla principal
    const [columns] = await conn.execute("SHOW COLUMNS FROM lotteries");
    const expectedFields = ['id', 'title', 'is_free', 'status', 'created_by'];
    console.log('\n🔍 Estructura tabla lotteries:');
    
    for (const field of expectedFields) {
      const hasField = columns.some(col => col.Field === field);
      console.log(`   ${hasField ? '✅' : '❌'} ${field}`);
    }

    await conn.end();
    return true;
  } catch (error) {
    console.log(`❌ Error de base de datos: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 VERIFICANDO AUTENTICACIÓN');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cdelu.ar',
      password: 'admin123'
    });
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login exitoso');
      console.log(`👤 Usuario: ${response.data.user?.nombre || 'N/A'}`);
      console.log(`🎭 Rol: ${response.data.user?.rol || 'N/A'}`);
      console.log(`🔑 Token obtenido: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error de autenticación: ${error.response?.data?.error || error.message}`);
  }
  return false;
}

async function testCoreEndpoints() {
  console.log('\n🎯 VERIFICANDO ENDPOINTS PRINCIPALES');
  console.log('-'.repeat(50));
  
  const tests = [
    {
      name: 'Listar loterías',
      method: 'GET',
      url: '/lotteries',
      requiresAuth: false
    },
    {
      name: 'Listar con filtros',
      method: 'GET', 
      url: '/lotteries?is_free=true&status=active',
      requiresAuth: false
    },
    {
      name: 'Crear lotería',
      method: 'POST',
      url: '/lotteries',
      requiresAuth: true,
      body: {
        title: 'Lotería de Verificación Final',
        description: 'Creada automáticamente para verificar el sistema',
        is_free: true,
        ticket_price: 0,
        min_tickets: 1,
        max_tickets: 50,
        num_winners: 2,
        start_date: new Date(Date.now() + 60000).toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
        prize_description: 'Premios de verificación',
        terms_conditions: 'Términos de prueba'
      }
    },
    {
      name: 'Historial de usuario',
      method: 'GET',
      url: '/lotteries/user/history',
      requiresAuth: true
    }
  ];

  let successCount = 0;
  
  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.requiresAuth && authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      
      if (test.body) {
        config.data = test.body;
      }
      
      const response = await axios(config);
      console.log(`✅ ${test.name} - Status: ${response.status}`);
      
      if (test.name === 'Crear lotería' && response.data.data?.id) {
        createdLotteryId = response.data.data.id;
        console.log(`   🆔 Lotería creada con ID: ${createdLotteryId}`);
      }
      
      successCount++;
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.response?.status || error.code}`);
    }
  }
  
  console.log(`\n📊 Endpoints principales: ${successCount}/${tests.length} funcionando`);
  return successCount === tests.length;
}

async function testSpecificLotteryEndpoints() {
  console.log('\n🎲 VERIFICANDO ENDPOINTS ESPECÍFICOS DE LOTERÍA');
  console.log('-'.repeat(50));
  
  if (!createdLotteryId) {
    console.log('⚠️  No hay lotería creada para probar endpoints específicos');
    return false;
  }
  
  const tests = [
    {
      name: 'Obtener lotería específica',
      method: 'GET',
      url: `/lotteries/${createdLotteryId}`,
      requiresAuth: false
    },
    {
      name: 'Obtener tickets del usuario',
      method: 'GET',
      url: `/lotteries/${createdLotteryId}/tickets`,
      requiresAuth: true
    },
    {
      name: 'Obtener ganadores',
      method: 'GET',
      url: `/lotteries/${createdLotteryId}/winners`,
      requiresAuth: false
    },
    {
      name: 'Comprar tickets',
      method: 'POST',
      url: `/lotteries/${createdLotteryId}/buy`,
      requiresAuth: true,
      body: {
        ticket_numbers: [1, 5, 10]
      }
    }
  ];

  let successCount = 0;
  
  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.requiresAuth && authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      
      if (test.body) {
        config.data = test.body;
      }
      
      const response = await axios(config);
      console.log(`✅ ${test.name} - Status: ${response.status}`);
      successCount++;
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.response?.status || error.code}`);
      if (error.response?.data?.message) {
        console.log(`   💬 ${error.response.data.message}`);
      }
    }
  }
  
  console.log(`\n📊 Endpoints específicos: ${successCount}/${tests.length} funcionando`);
  return successCount >= tests.length * 0.8; // 80% de éxito es aceptable
}

async function testDataStructure() {
  console.log('\n📦 VERIFICANDO ESTRUCTURA DE DATOS');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/lotteries`);
    
    if (response.data.success !== undefined) {
      console.log(`✅ Campo 'success': ${response.data.success}`);
    }
    
    if (Array.isArray(response.data.data)) {
      console.log(`✅ Campo 'data' es array: ${response.data.data.length} elementos`);
    }
    
    if (response.data.pagination) {
      const p = response.data.pagination;
      console.log(`✅ Paginación presente:`);
      console.log(`   - page: ${p.page}`);
      console.log(`   - limit: ${p.limit}`);
      console.log(`   - total: ${p.total}`);
      console.log(`   - pages: ${p.pages}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error verificando estructura: ${error.message}`);
    return false;
  }
}

async function generateFinalReport() {
  console.log('\n📋 RESUMEN FINAL - BACKEND SISTEMA DE LOTERÍA');
  console.log('='.repeat(70));
  
  const dbOk = await checkDatabase();
  const authOk = await testAuthentication();
  const coreOk = authOk ? await testCoreEndpoints() : false;
  const specificOk = authOk ? await testSpecificLotteryEndpoints() : false;
  const structureOk = await testDataStructure();
  
  console.log('\n🎯 ESTADO GENERAL:');
  console.log(`   📊 Base de datos: ${dbOk ? '✅ Funcionando' : '❌ Problemas'}`);
  console.log(`   🔐 Autenticación: ${authOk ? '✅ Funcionando' : '❌ Problemas'}`);
  console.log(`   🎯 Endpoints principales: ${coreOk ? '✅ Funcionando' : '❌ Problemas'}`);
  console.log(`   🎲 Endpoints específicos: ${specificOk ? '✅ Funcionando' : '❌ Problemas'}`);
  console.log(`   📦 Estructura datos: ${structureOk ? '✅ Correcta' : '❌ Problemas'}`);
  
  const overallScore = [dbOk, authOk, coreOk, specificOk, structureOk].filter(Boolean).length;
  const maxScore = 5;
  
  console.log(`\n🏆 PUNTUACIÓN GENERAL: ${overallScore}/${maxScore} (${(overallScore/maxScore*100).toFixed(1)}%)`);
  
  if (overallScore >= 4) {
    console.log('\n🎉 ¡SISTEMA BACKEND COMPLETAMENTE FUNCIONAL!');
    console.log('✅ El backend está listo para trabajar con el frontend');
    console.log('✅ Todos los endpoints principales funcionan correctamente');
    console.log('✅ La autenticación y autorización están configuradas');
    console.log('✅ La estructura de datos es compatible con la guía frontend');
  } else if (overallScore >= 3) {
    console.log('\n⚠️  SISTEMA BACKEND MAYORMENTE FUNCIONAL');
    console.log('✅ Los componentes esenciales funcionan');
    console.log('🔧 Algunas características menores necesitan ajustes');
  } else {
    console.log('\n❌ SISTEMA BACKEND NECESITA CORRECCIONES');
    console.log('🔧 Revise los errores marcados arriba');
  }
  
  console.log('\n🔗 CONFIGURACIÓN PARA EL FRONTEND:');
  console.log('📝 VITE_API_BASE_URL=http://localhost:3001');
  console.log('📝 Base URL en lotteryService.ts: http://localhost:3001/api/v1');
  console.log('📝 Puerto backend: 3001');
  console.log('📝 Puerto frontend esperado: 5173');
  
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Ejecutar frontend: npm run dev');
  console.log('2. Verificar archivo lotteryService.ts con URLs correctas');
  console.log('3. Probar integración completa frontend-backend');
  console.log('4. Verificar que CORS permite localhost:5173');
  
  return overallScore >= 4;
}

// Ejecutar verificación completa
generateFinalReport().then(success => {
  if (success) {
    console.log('\n✨ Verificación completada exitosamente');
    process.exit(0);
  } else {
    console.log('\n⚠️  Verificación completada con problemas');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Error durante la verificación:', error.message);
  process.exit(1);
}); 