const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function debugToken() {
  try {
    console.log('🔍 Debuggeando token JWT...\n');
    
    // 1. Login como administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'lottery_admin@cdelu.ar',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('Token:', adminToken.substring(0, 50) + '...');
    
    // 2. Verificar perfil del usuario
    console.log('\n2️⃣ Verificando perfil del usuario...');
    const profileResponse = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Perfil del usuario:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
    // 3. Decodificar token manualmente (solo para debug)
    const tokenParts = adminToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('\n3️⃣ Payload del token JWT:');
      console.log(JSON.stringify(payload, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

debugToken(); 