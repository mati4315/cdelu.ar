const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testLotterySystem() {
  try {
    console.log('🎰 Probando sistema de lotería...\n');
    
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
    const freeLotteryData = {
      title: 'Lotería Gratuita de Prueba',
      description: 'Lotería gratuita para probar el sistema',
      is_free: true,
      ticket_price: 0,
      min_tickets: 1,
      max_tickets: 50,
      num_winners: 3,
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En una semana
      prize_description: 'Premio especial para ganadores',
      terms_conditions: 'Términos y condiciones de prueba'
    };
    
    const freeLotteryResponse = await axios.post(`${BASE_URL}/api/lotteries`, freeLotteryData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const freeLotteryId = freeLotteryResponse.data.data.id;
    console.log('✅ Lotería gratuita creada con ID:', freeLotteryId);
    
    // 3. Crear lotería de pago
    console.log('\n3️⃣ Creando lotería de pago...');
    const paidLotteryData = {
      title: 'Lotería de Pago de Prueba',
      description: 'Lotería de pago para probar el sistema',
      is_free: false,
      ticket_price: 10.50,
      min_tickets: 5,
      max_tickets: 100,
      num_winners: 5,
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      prize_description: 'Premio en efectivo para ganadores',
      terms_conditions: 'Términos y condiciones de prueba para lotería de pago'
    };
    
    const paidLotteryResponse = await axios.post(`${BASE_URL}/api/lotteries`, paidLotteryData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const paidLotteryId = paidLotteryResponse.data.data.id;
    console.log('✅ Lotería de pago creada con ID:', paidLotteryId);
    
    // 4. Activar loterías
    console.log('\n4️⃣ Activando loterías...');
    await axios.put(`${BASE_URL}/api/lotteries/${freeLotteryId}`, {
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    await axios.put(`${BASE_URL}/api/lotteries/${paidLotteryId}`, {
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Loterías activadas');
    
    // 5. Obtener lista de loterías
    console.log('\n5️⃣ Obteniendo lista de loterías...');
    const lotteriesResponse = await axios.get(`${BASE_URL}/api/lotteries`);
    console.log('✅ Loterías disponibles:', lotteriesResponse.data.data.length);
    
    lotteriesResponse.data.data.forEach(lottery => {
      console.log(`   - ${lottery.title} (${lottery.is_free ? 'Gratuita' : 'De pago'}) - Estado: ${lottery.status}`);
    });
    
    // 6. Obtener detalles de una lotería
    console.log('\n6️⃣ Obteniendo detalles de lotería...');
    const lotteryDetailsResponse = await axios.get(`${BASE_URL}/api/lotteries/${freeLotteryId}`);
    const lottery = lotteryDetailsResponse.data.data;
    console.log('✅ Detalles de lotería:');
    console.log(`   Título: ${lottery.title}`);
    console.log(`   Tickets vendidos: ${lottery.tickets_sold || 0}/${lottery.max_tickets}`);
    console.log(`   Estado: ${lottery.current_status || lottery.status}`);
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Lotería gratuita creada: ID ${freeLotteryId}`);
    console.log(`   - Lotería de pago creada: ID ${paidLotteryId}`);
    console.log(`   - Total de loterías: ${lotteriesResponse.data.data.length}`);
    
    console.log('\n🌐 URLs para probar:');
    console.log(`   Dashboard Admin: ${BASE_URL}/lottery-admin.html`);
    console.log(`   Página Usuarios: ${BASE_URL}/lottery.html`);
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response?.data) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

testLotterySystem(); 