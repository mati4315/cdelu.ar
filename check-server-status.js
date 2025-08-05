const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...\n');

  try {
    // 1. Verificar si el servidor responde
    console.log('1️⃣ Verificando si el servidor responde...');
    try {
      const response = await axios.get('http://localhost:3001/');
      console.log('✅ Servidor responde correctamente');
    } catch (error) {
      console.log('❌ Servidor no responde:', error.message);
      return;
    }

    // 2. Verificar endpoint de login
    console.log('\n2️⃣ Verificando endpoint de login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'matias4315@gmail.com',
        password: 'w35115415'
      });
      console.log('✅ Login exitoso');
      console.log('📋 Token obtenido:', loginResponse.data.token ? 'SÍ' : 'NO');
    } catch (error) {
      console.log('❌ Error en login:', error.response?.status, error.response?.data || error.message);
    }

    // 3. Verificar endpoint de estadísticas
    console.log('\n3️⃣ Verificando endpoint de estadísticas...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/stats`);
      console.log('✅ Endpoint de estadísticas funciona');
    } catch (error) {
      console.log('❌ Error en estadísticas:', error.response?.status, error.response?.data || error.message);
    }

    // 4. Verificar endpoint de noticias
    console.log('\n4️⃣ Verificando endpoint de noticias...');
    try {
      const newsResponse = await axios.get(`${BASE_URL}/news?limit=1`);
      console.log('✅ Endpoint de noticias funciona');
    } catch (error) {
      console.log('❌ Error en noticias:', error.response?.status, error.response?.data || error.message);
    }

    // 5. Verificar si las rutas de admin están registradas
    console.log('\n5️⃣ Verificando rutas de administración...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/admin/database/status`);
      console.log('✅ Rutas de administración funcionan');
    } catch (error) {
      console.log('❌ Error en rutas de admin:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n🎉 Verificación completada');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkServerStatus(); 