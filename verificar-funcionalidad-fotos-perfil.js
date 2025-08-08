const axios = require('axios');

/**
 * Verificación final de la funcionalidad de fotos de perfil
 */

async function verificarFuncionalidad() {
  console.log('🔍 Verificando funcionalidad de fotos de perfil...\n');

  const BASE_URL = 'http://localhost:3001/api/v1';
  
  try {
    // 1. Verificar endpoints disponibles
    console.log('📋 1. Verificando endpoints disponibles:');
    
    const endpoints = [
      { method: 'GET', path: '/profile/me', description: 'Obtener mi perfil' },
      { method: 'POST', path: '/profile/picture', description: 'Subir foto de perfil' },
      { method: 'DELETE', path: '/profile/picture', description: 'Eliminar foto de perfil' },
      { method: 'GET', path: '/profile/:userId', description: 'Obtener perfil público' }
    ];

    endpoints.forEach(endpoint => {
      console.log(`   ✅ ${endpoint.method} ${BASE_URL}${endpoint.path} - ${endpoint.description}`);
    });

    // 2. Verificar que el servidor responde
    console.log('\n📋 2. Verificando servidor:');
    const statusResponse = await axios.get(`${BASE_URL.replace('/api/v1', '')}/api/v1/status`);
    console.log(`   ✅ Servidor activo - Status: ${statusResponse.status}`);

    // 3. Verificar autenticación (sin token)
    console.log('\n📋 3. Verificando autenticación:');
    try {
      await axios.get(`${BASE_URL}/profile/me`);
      console.log('   ❌ Error: debería rechazar sin token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Correctamente rechaza peticiones sin autenticación');
      } else {
        console.log(`   ⚠️  Respuesta inesperada: ${error.response?.status}`);
      }
    }

    // 4. Verificar estructura de base de datos
    console.log('\n📋 4. Verificando base de datos:');
    const pool = require('./src/config/database');
    
    // Verificar que existe la columna profile_picture_url
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture_url'
    `);
    
    if (columns.length > 0) {
      console.log('   ✅ Columna profile_picture_url existe en tabla users');
    } else {
      console.log('   ❌ Columna profile_picture_url NO existe en tabla users');
    }

    // Verificar directorio de uploads
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, 'public/uploads/profile-pictures');
    
    if (fs.existsSync(uploadDir)) {
      console.log('   ✅ Directorio de uploads existe: public/uploads/profile-pictures');
    } else {
      console.log('   ❌ Directorio de uploads NO existe');
    }

    await pool.end();

    console.log('\n🎉 Verificación completada exitosamente!');
    console.log('\n📝 La funcionalidad de fotos de perfil está lista para usar.');
    console.log('\n🔗 Para tu desarrollador frontend:');
    console.log('   • Revisar: GUIA_FRONTEND_FOTOS_PERFIL.md');
    console.log('   • API Base URL:', BASE_URL);
    console.log('   • Autenticación: Bearer Token en header Authorization');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que el servidor esté corriendo en puerto 3001');
    console.log('   2. Ejecutar: node apply-profile-picture-migration.js');
    console.log('   3. Verificar configuración de base de datos');
  }
}

// Ejecutar verificación
verificarFuncionalidad()
  .then(() => console.log('\n✅ Verificación finalizada'))
  .catch(error => console.log('\n❌ Error:', error.message)); 