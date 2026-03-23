const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testLotteryDirect() {
  try {
    console.log('🎰 Probando endpoint de lotería directamente...\n');
    
    // 1. Login como administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'lottery_admin@cdelu.ar',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // 2. Probar endpoint de listar loterías (público)
    console.log('\n2️⃣ Probando endpoint público de loterías...');
    const lotteriesResponse = await axios.get(`${BASE_URL}/api/lotteries`);
    console.log('✅ Loterías disponibles:', lotteriesResponse.data.data.length);
    
    // 3. Probar endpoint de crear lotería con token
    console.log('\n3️⃣ Probando endpoint de crear lotería...');
    const lotteryData = {
      title: 'Lotería de Prueba Directa',
      description: 'Lotería para probar el endpoint directamente',
      is_free: true,
      ticket_price: 0,
      min_tickets: 1,
      max_tickets: 10,
      num_winners: 1,
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    try {
      const createResponse = await axios.post(`${BASE_URL}/api/lotteries`, lotteryData, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Lotería creada exitosamente:', createResponse.data);
    } catch (error) {
      console.log('❌ Error al crear lotería:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

testLotteryDirect(); 