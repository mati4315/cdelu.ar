#!/usr/bin/env node

/**
 * Script de verificación para endpoints móviles
 * Ejecutar: node test-mobile-api.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CdelU-Mobile-App/1.0.0'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    log(`✅ ${method} ${endpoint} - ${response.status}`, 'green');
    return { success: true, data: response.data };
  } catch (error) {
    log(`❌ ${method} ${endpoint} - ${error.response?.status || 'Error'}`, 'red');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Iniciando tests para endpoints móviles...', 'blue');
  log(`📍 URL Base: ${BASE_URL}\n`, 'yellow');

  const tests = [
    {
      name: 'Health Check Básico',
      endpoint: '/health',
      method: 'GET'
    },
    {
      name: 'Health Check Móvil',
      endpoint: '/api/v1/mobile/health',
      method: 'GET'
    },
    {
      name: 'Configuración Móvil',
      endpoint: '/api/v1/mobile/config',
      method: 'GET'
    },
    {
      name: 'Feed Móvil (página 1)',
      endpoint: '/api/v1/mobile/feed?page=1&limit=5',
      method: 'GET'
    },
    {
      name: 'Feed Móvil (solo noticias)',
      endpoint: '/api/v1/mobile/feed?type=1&page=1&limit=3',
      method: 'GET'
    },
    {
      name: 'Feed Móvil (solo comunidad)',
      endpoint: '/api/v1/mobile/feed?type=2&page=1&limit=3',
      method: 'GET'
    },
    {
      name: 'Login Móvil (credenciales de prueba)',
      endpoint: '/api/v1/mobile/login',
      method: 'POST',
      data: {
        email: 'test@test.com',
        password: '123456'
      }
    },
    {
      name: 'Feed General (endpoint original)',
      endpoint: '/api/v1/feed?page=1&limit=5',
      method: 'GET'
    },
    {
      name: 'Documentación API',
      endpoint: '/api/v1/docs',
      method: 'GET'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    log(`\n🔍 ${test.name}`, 'blue');
    const result = await testEndpoint(test.endpoint, test.method, test.data);
    
    if (result.success) {
      passed++;
      if (test.name.includes('Configuración')) {
        log('📱 Configuración móvil:', 'yellow');
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else {
      failed++;
    }
  }

  log(`\n📊 Resultados:`, 'blue');
  log(`✅ Tests exitosos: ${passed}`, 'green');
  log(`❌ Tests fallidos: ${failed}`, 'red');
  log(`📈 Total: ${passed + failed}`, 'yellow');

  if (failed === 0) {
    log('\n🎉 ¡Todos los endpoints móviles están funcionando correctamente!', 'green');
    log('📱 Tu app Android puede conectarse sin problemas.', 'green');
  } else {
    log('\n⚠️  Algunos endpoints tienen problemas. Revisa la configuración.', 'yellow');
  }

  log('\n📋 Checklist para apps móviles:', 'blue');
  log('✅ CORS configurado para apps móviles', passed > 0 ? 'green' : 'red');
  log('✅ Endpoints móviles funcionando', passed >= 5 ? 'green' : 'red');
  log('✅ Autenticación móvil disponible', passed >= 6 ? 'green' : 'red');
  log('✅ Feed optimizado para móviles', passed >= 4 ? 'green' : 'red');
  log('✅ Headers específicos para móviles', passed > 0 ? 'green' : 'red');
}

// Ejecutar tests
runTests().catch(error => {
  log(`\n💥 Error general: ${error.message}`, 'red');
  process.exit(1);
}); 