const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testCompleteSystem() {
  console.log('🧪 Probando sistema completo...\n');
  
  try {
    // 1. Test de conectividad básica
    console.log('1️⃣ Probando conectividad básica...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // 2. Test de login
    console.log('\n2️⃣ Probando login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: '123456'
    });
    console.log('✅ Login exitoso');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('Usuario:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    
    // 3. Test de perfil de usuario
    console.log('\n3️⃣ Probando perfil de usuario...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Perfil obtenido:', profileResponse.data.user);
    
    // 4. Test de feed
    console.log('\n4️⃣ Probando feed...');
    const feedResponse = await axios.get(`${BASE_URL}/feed`);
    console.log('✅ Feed obtenido:', feedResponse.data.data.length, 'elementos');
    
    // 5. Test de noticias
    console.log('\n5️⃣ Probando noticias...');
    const newsResponse = await axios.get(`${BASE_URL}/news`);
    console.log('✅ Noticias obtenidas:', newsResponse.data.data.length, 'elementos');
    
    // 6. Test de registro (nuevo usuario)
    console.log('\n6️⃣ Probando registro de usuario...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Prueba',
      email: 'prueba@test.com',
      password: '123456',
      role: 'usuario'
    });
    console.log('✅ Usuario registrado:', registerResponse.data.user);
    
    // 7. Test de login con nuevo usuario
    console.log('\n7️⃣ Probando login con nuevo usuario...');
    const newUserLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'prueba@test.com',
      password: '123456'
    });
    console.log('✅ Login con nuevo usuario exitoso');
    
    console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Conectividad básica');
    console.log('- ✅ Autenticación (login/registro)');
    console.log('- ✅ Perfil de usuario');
    console.log('- ✅ Feed de contenido');
    console.log('- ✅ Noticias');
    console.log('- ✅ JWT tokens');
    
    console.log('\n🚀 El sistema está listo para subir al hosting!');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCompleteSystem(); 