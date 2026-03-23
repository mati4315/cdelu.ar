const fs = require('node:fs');
const path = require('node:path');

/**
 * Script de prueba para la funcionalidad de fotos de perfil
 * Incluye pruebas de subida, consulta y eliminación
 */

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Credenciales de prueba
const TEST_USER = {
  email: 'test-profile@example.com',
  password: 'test123456',
  nombre: 'Usuario Test Perfil'
};

// Variable para almacenar el token de autenticación
let authToken = null;
let userId = null;

/**
 * Función para hacer peticiones HTTP
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });

    const data = await response.json().catch(() => null);
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    console.error('❌ Error en petición HTTP:', error);
    return { status: 0, ok: false, error: error.message };
  }
}

/**
 * Función para crear FormData con archivo de prueba
 */
function createTestImageFormData() {
  // Crear una imagen de prueba pequeña (1x1 pixel PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x82, 0x84, 0x83, 0x91, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND chunk
  ]);

  const formData = new FormData();
  const blob = new Blob([pngData], { type: 'image/png' });
  formData.append('profile_picture', blob, 'test-profile.png');
  
  return formData;
}

/**
 * Test: Registrar usuario de prueba
 */
async function testRegisterUser() {
  console.log('\n🔬 Test 1: Registrar usuario de prueba');
  
  const response = await makeRequest(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (response.ok) {
    authToken = response.data.token;
    userId = response.data.user.id;
    console.log('✅ Usuario registrado exitosamente');
    console.log(`   ID: ${userId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else if (response.status === 400 && response.data?.error?.includes('ya está registrado')) {
    // El usuario ya existe, intentar login
    console.log('ℹ️  Usuario ya existe, intentando login...');
    return await testLoginUser();
  } else {
    console.log('❌ Error al registrar usuario:', response.data);
    return false;
  }
}

/**
 * Test: Login de usuario
 */
async function testLoginUser() {
  console.log('\n🔬 Test 2: Login de usuario');
  
  const response = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
  });

  if (response.ok) {
    authToken = response.data.token;
    userId = response.data.user.id;
    console.log('✅ Login exitoso');
    console.log(`   ID: ${userId}`);
    console.log(`   Profile Picture URL: ${response.data.user.profile_picture_url || 'null'}`);
    return true;
  } else {
    console.log('❌ Error en login:', response.data);
    return false;
  }
}

/**
 * Test: Obtener perfil sin foto
 */
async function testGetProfile() {
  console.log('\n🔬 Test 3: Obtener perfil del usuario');
  
  const response = await makeRequest(`${API_BASE}/profile/me`, {
    method: 'GET'
  });

  if (response.ok) {
    console.log('✅ Perfil obtenido exitosamente');
    console.log('   Datos del usuario:', {
      id: response.data.user.id,
      nombre: response.data.user.nombre,
      email: response.data.user.email,
      profile_picture_url: response.data.user.profile_picture_url
    });
    return true;
  } else {
    console.log('❌ Error al obtener perfil:', response.data);
    return false;
  }
}

/**
 * Test: Subir foto de perfil
 */
async function testUploadProfilePicture() {
  console.log('\n🔬 Test 4: Subir foto de perfil');
  
  const formData = createTestImageFormData();
  
  const response = await makeRequest(`${API_BASE}/profile/picture`, {
    method: 'POST',
    headers: {
      // No agregar Content-Type, fetch lo hará automáticamente con boundary
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  if (response.ok) {
    console.log('✅ Foto de perfil subida exitosamente');
    console.log(`   URL: ${response.data.profile_picture_url}`);
    return true;
  } else {
    console.log('❌ Error al subir foto de perfil:', response.data);
    return false;
  }
}

/**
 * Test: Verificar perfil con foto
 */
async function testGetProfileWithPicture() {
  console.log('\n🔬 Test 5: Verificar perfil con foto');
  
  const response = await makeRequest(`${API_BASE}/profile/me`, {
    method: 'GET'
  });

  if (response.ok && response.data.user.profile_picture_url) {
    console.log('✅ Perfil con foto verificado');
    console.log(`   Foto URL: ${response.data.user.profile_picture_url}`);
    return true;
  } else {
    console.log('❌ Error: perfil sin foto o error en consulta:', response.data);
    return false;
  }
}

/**
 * Test: Obtener perfil público
 */
async function testGetPublicProfile() {
  console.log('\n🔬 Test 6: Obtener perfil público');
  
  const response = await makeRequest(`${API_BASE}/profile/${userId}`, {
    method: 'GET'
  });

  if (response.ok) {
    console.log('✅ Perfil público obtenido exitosamente');
    console.log('   Datos públicos:', {
      id: response.data.user.id,
      nombre: response.data.user.nombre,
      rol: response.data.user.rol,
      profile_picture_url: response.data.user.profile_picture_url
    });
    return true;
  } else {
    console.log('❌ Error al obtener perfil público:', response.data);
    return false;
  }
}

/**
 * Test: Eliminar foto de perfil
 */
async function testDeleteProfilePicture() {
  console.log('\n🔬 Test 7: Eliminar foto de perfil');
  
  const response = await makeRequest(`${API_BASE}/profile/picture`, {
    method: 'DELETE'
  });

  if (response.ok) {
    console.log('✅ Foto de perfil eliminada exitosamente');
    return true;
  } else {
    console.log('❌ Error al eliminar foto de perfil:', response.data);
    return false;
  }
}

/**
 * Test: Verificar perfil sin foto
 */
async function testGetProfileWithoutPicture() {
  console.log('\n🔬 Test 8: Verificar perfil sin foto');
  
  const response = await makeRequest(`${API_BASE}/profile/me`, {
    method: 'GET'
  });

  if (response.ok && !response.data.user.profile_picture_url) {
    console.log('✅ Perfil sin foto verificado');
    return true;
  } else {
    console.log('❌ Error: perfil aún tiene foto o error en consulta:', response.data);
    return false;
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log('🚀 Iniciando tests de funcionalidad de fotos de perfil');
  console.log('=' .repeat(60));

  const tests = [
    testRegisterUser,
    testGetProfile,
    testUploadProfilePicture,
    testGetProfileWithPicture,
    testGetPublicProfile,
    testDeleteProfilePicture,
    testGetProfileWithoutPicture
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passedTests++;
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ Error en test:', error);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Resultados: ${passedTests}/${totalTests} tests exitosos`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los tests pasaron! La funcionalidad de fotos de perfil está funcionando correctamente.');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revise los errores anteriores.');
  }

  console.log('\n📝 Endpoints disponibles:');
  console.log('  • POST /api/v1/profile/picture - Subir foto de perfil');
  console.log('  • DELETE /api/v1/profile/picture - Eliminar foto de perfil');
  console.log('  • GET /api/v1/profile/me - Obtener mi perfil');
  console.log('  • GET /api/v1/profile/:userId - Obtener perfil público');
}

// Verificar si fetch está disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Este script requiere Node.js 18+ para usar fetch');
  console.log('💡 Alternativa: instale node-fetch: npm install node-fetch');
  process.exit(1);
}

// Ejecutar tests si es llamado directamente
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✅ Tests finalizados');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests }; 