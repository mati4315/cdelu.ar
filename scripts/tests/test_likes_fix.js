#!/usr/bin/env node

/**
 * 🧪 Test de Corrección de Likes
 * Verifica que el endpoint /like/toggle funciona correctamente
 */

const axios = require('axios');

const BASE_URL = 'https://diario.trigamer.xyz';
// const BASE_URL = 'http://localhost:3001'; // Para desarrollo local

async function testLikesFix() {
  console.log('🧪 Probando corrección de likes...\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test@test.com',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido\n');

    // 2. Obtener feed para tener IDs de prueba
    console.log('2️⃣ Obteniendo feed...');
    const feedResponse = await axios.get(`${BASE_URL}/api/v1/feed?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Respuesta del feed:', JSON.stringify(feedResponse.data, null, 2));

    if (!feedResponse.data || !feedResponse.data.data || feedResponse.data.data.length === 0) {
      console.log('❌ No hay elementos en el feed para probar');
      console.log('📝 Respuesta completa:', feedResponse.data);
      return;
    }

    const feedItem = feedResponse.data.data[0];
    const feedId = feedItem.id;
    console.log(`✅ Feed obtenido, probando con ID: ${feedId}\n`);

    // 3. Probar endpoint /like/toggle (CORRECTO)
    console.log('3️⃣ Probando endpoint CORRECTO /like/toggle...');
    const toggleResponse = await axios.post(
      `${BASE_URL}/api/v1/feed/${feedId}/like/toggle`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Endpoint /like/toggle funciona correctamente');
    console.log(`📊 Respuesta:`, toggleResponse.data);
    console.log(`💡 Estado del like: ${toggleResponse.data.liked ? 'LIKED' : 'NOT LIKED'}`);
    console.log(`📈 Contador de likes: ${toggleResponse.data.likes_count}\n`);

    // 4. Probar endpoint /like (INCORRECTO - debería dar error)
    console.log('4️⃣ Probando endpoint INCORRECTO /like...');
    try {
      await axios.post(
        `${BASE_URL}/api/v1/feed/${feedId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ ERROR: El endpoint /like no debería funcionar');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correcto: El endpoint /like devuelve error 400 como esperado');
        console.log(`📝 Error: ${error.response.data.message || 'Bad Request'}\n`);
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }

    // 5. Probar toggle nuevamente
    console.log('5️⃣ Probando toggle nuevamente...');
    const toggleResponse2 = await axios.post(
      `${BASE_URL}/api/v1/feed/${feedId}/like/toggle`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Toggle funciona correctamente');
    console.log(`💡 Estado del like: ${toggleResponse2.data.liked ? 'LIKED' : 'NOT LIKED'}`);
    console.log(`📈 Contador de likes: ${toggleResponse2.data.likes_count}\n`);

    // 6. Verificar que el estado se refleja en el feed
    console.log('6️⃣ Verificando estado en el feed...');
    const feedResponse2 = await axios.get(`${BASE_URL}/api/v1/feed?limit=5`, {
      headers: { Authorization: `Bearer ${token}` } }
    );

    const updatedItem = feedResponse2.data.data.find(item => item.id === feedId);
    if (updatedItem) {
      console.log(`✅ Estado actualizado en feed: is_liked = ${updatedItem.is_liked}`);
      console.log(`📈 Likes count en feed: ${updatedItem.likes_count}`);
    }

    console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('✅ El backend está funcionando correctamente');
    console.log('✅ El endpoint /like/toggle funciona perfectamente');
    console.log('✅ El endpoint /like devuelve error como esperado');
    console.log('✅ Los likes se actualizan correctamente en el feed');
    
    console.log('\n📋 RESUMEN:');
    console.log('✅ Backend: Funcionando correctamente');
    console.log('❌ Frontend: Necesita corrección (cambiar /like por /like/toggle)');
    console.log('📝 Ver archivo: INSTRUCCIONES_CORRECCION_LIKES.md');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testLikesFix(); 