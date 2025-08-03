const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testLotteryComplete() {
  try {
    console.log('🎰 Probando sistema completo de lotería...\n');
    
    // 1. Login como administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'lottery_admin@cdelu.ar',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // 2. Crear lotería gratuita
    console.log('\n2️⃣ Creando lotería gratuita...');
    const lotteryData = {
      title: 'Lotería Gratuita de Prueba',
      description: 'Lotería gratuita para probar el sistema',
      is_free: true,
      ticket_price: 0,
      min_tickets: 1,
      max_tickets: 50,
      num_winners: 3,
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      prize_description: 'Premio especial para ganadores',
      terms_conditions: 'Términos y condiciones de prueba'
    };
    
    try {
      const createResponse = await axios.post(`${BASE_URL}/api/lotteries`, lotteryData, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Lotería creada exitosamente:', createResponse.data.data.id);
      
      // 3. Obtener lista de loterías
      console.log('\n3️⃣ Obteniendo lista de loterías...');
      const lotteriesResponse = await axios.get(`${BASE_URL}/api/lotteries`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Loterías disponibles:', lotteriesResponse.data.data.length);
      
      // 4. Obtener detalles de la lotería creada
      const lotteryId = createResponse.data.data.id;
      console.log('\n4️⃣ Obteniendo detalles de lotería...');
      const lotteryDetailsResponse = await axios.get(`${BASE_URL}/api/lotteries/${lotteryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Detalles de lotería:', lotteryDetailsResponse.data.data.title);
      
      console.log('\n🎉 Sistema funcionando correctamente!');
      console.log('\n📋 URLs para probar:');
      console.log(`   Dashboard Admin: ${BASE_URL}/lottery-admin.html`);
      console.log(`   Página Usuarios: ${BASE_URL}/lottery.html`);
      
    } catch (error) {
      console.log('❌ Error al crear/probar lotería:');
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

testLotteryComplete(); 