const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testPublicLotteryRoutes() {
  try {
    console.log('🎰 Probando rutas públicas de lotería...\n');
    
    // 1. Probar endpoint público de loterías sin token
    console.log('1️⃣ Probando GET /api/lotteries sin token...');
    try {
      const response = await axios.get(`${BASE_URL}/api/lotteries`);
      console.log('✅ Éxito - Loterías obtenidas:', response.data.data.length);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    // 2. Probar endpoint de health (debería funcionar)
    console.log('\n2️⃣ Probando GET /health...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Éxito - Health check:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    // 3. Probar endpoint de auth (debería funcionar)
    console.log('\n3️⃣ Probando POST /api/v1/auth/login...');
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'lottery_admin@cdelu.ar',
        password: 'admin123'
      });
      console.log('✅ Éxito - Login:', response.data.token ? 'Token generado' : 'Sin token');
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testPublicLotteryRoutes(); 