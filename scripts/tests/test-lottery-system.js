const axios = require('axios');
require('dotenv').config();

/**
 * Script para probar el sistema de lotería completo
 */

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://diario.trigamer.xyz' 
  : 'http://localhost:3001';

let adminToken = null;
let userToken = null;

async function testLotterySystem() {
  console.log('🎰 Iniciando pruebas del sistema de lotería...\n');
  
  try {
    // 1. Login como administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    await loginAsAdmin();
    
    // 2. Crear lotería gratuita
    console.log('\n2️⃣ Creando lotería gratuita...');
    const freeLotteryId = await createFreeLottery();
    
    // 3. Crear lotería de pago
    console.log('\n3️⃣ Creando lotería de pago...');
    const paidLotteryId = await createPaidLottery();
    
    // 4. Activar loterías
    console.log('\n4️⃣ Activando loterías...');
    await activateLottery(freeLotteryId);
    await activateLottery(paidLotteryId);
    
    // 5. Login como usuario normal
    console.log('\n5️⃣ Iniciando sesión como usuario...');
    await loginAsUser();
    
    // 6. Participar en lotería gratuita
    console.log('\n6️⃣ Participando en lotería gratuita...');
    await participateInLottery(freeLotteryId, [1, 5, 10, 15]);
    
    // 7. Participar en lotería de pago
    console.log('\n7️⃣ Participando en lotería de pago...');
    await participateInLottery(paidLotteryId, [2, 7, 12, 18]);
    
    // 8. Ver tickets del usuario
    console.log('\n8️⃣ Verificando tickets del usuario...');
    await viewUserTickets(freeLotteryId);
    await viewUserTickets(paidLotteryId);
    
    // 9. Login como admin y finalizar lotería
    console.log('\n9️⃣ Finalizando lotería como administrador...');
    await loginAsAdmin();
    await finishLottery(freeLotteryId);
    
    // 10. Ver ganadores
    console.log('\n🔟 Verificando ganadores...');
    await viewWinners(freeLotteryId);
    
    // 11. Obtener estadísticas
    console.log('\n1️⃣1️⃣ Obteniendo estadísticas...');
    await getLotteryStats();
    
    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    adminToken = response.data.token;
    console.log('✅ Login como administrador exitoso');
  } catch (error) {
    throw new Error('Error en login de administrador: ' + error.message);
  }
}

async function loginAsUser() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      username: 'usuario',
      password: 'usuario123'
    });
    
    userToken = response.data.token;
    console.log('✅ Login como usuario exitoso');
  } catch (error) {
    throw new Error('Error en login de usuario: ' + error.message);
  }
}

async function createFreeLottery() {
  try {
    const lotteryData = {
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
    
    const response = await axios.post(`${BASE_URL}/api/lotteries`, lotteryData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lotería gratuita creada con ID:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    throw new Error('Error al crear lotería gratuita: ' + error.message);
  }
}

async function createPaidLottery() {
  try {
    const lotteryData = {
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
    
    const response = await axios.post(`${BASE_URL}/api/lotteries`, lotteryData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lotería de pago creada con ID:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    throw new Error('Error al crear lotería de pago: ' + error.message);
  }
}

async function activateLottery(lotteryId) {
  try {
    await axios.put(`${BASE_URL}/api/lotteries/${lotteryId}`, {
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lotería activada:', lotteryId);
  } catch (error) {
    throw new Error('Error al activar lotería: ' + error.message);
  }
}

async function participateInLottery(lotteryId, ticketNumbers) {
  try {
    const response = await axios.post(`${BASE_URL}/api/lotteries/${lotteryId}/buy`, {
      ticket_numbers: ticketNumbers
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✅ Participación exitosa en lotería:', lotteryId);
    console.log('   Tickets comprados:', ticketNumbers);
    console.log('   Respuesta:', response.data.message);
  } catch (error) {
    throw new Error('Error al participar en lotería: ' + error.message);
  }
}

async function viewUserTickets(lotteryId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/lotteries/${lotteryId}/tickets`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✅ Tickets del usuario en lotería:', lotteryId);
    console.log('   Cantidad de tickets:', response.data.data.length);
    response.data.data.forEach(ticket => {
      console.log(`   - Ticket #${ticket.ticket_number} (${ticket.payment_status})`);
    });
  } catch (error) {
    throw new Error('Error al ver tickets del usuario: ' + error.message);
  }
}

async function finishLottery(lotteryId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/lotteries/${lotteryId}/finish`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lotería finalizada:', lotteryId);
    console.log('   Estado:', response.data.data.status);
    console.log('   Ganadores:', response.data.data.winners_count);
  } catch (error) {
    throw new Error('Error al finalizar lotería: ' + error.message);
  }
}

async function viewWinners(lotteryId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/lotteries/${lotteryId}/winners`);
    
    console.log('✅ Ganadores de lotería:', lotteryId);
    console.log('   Cantidad de ganadores:', response.data.data.length);
    response.data.data.forEach(winner => {
      console.log(`   - Ticket #${winner.ticket_number} - Usuario: ${winner.username}`);
    });
  } catch (error) {
    throw new Error('Error al ver ganadores: ' + error.message);
  }
}

async function getLotteryStats() {
  try {
    const response = await axios.get(`${BASE_URL}/api/lotteries?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const lotteries = response.data.data;
    console.log('✅ Estadísticas del sistema:');
    console.log('   Total de loterías:', lotteries.length);
    console.log('   Loterías activas:', lotteries.filter(l => l.current_status === 'running').length);
    console.log('   Loterías finalizadas:', lotteries.filter(l => l.status === 'finished').length);
    console.log('   Loterías gratuitas:', lotteries.filter(l => l.is_free).length);
    console.log('   Loterías de pago:', lotteries.filter(l => !l.is_free).length);
    
    const totalTickets = lotteries.reduce((sum, l) => sum + (l.tickets_sold || 0), 0);
    console.log('   Total de tickets vendidos:', totalTickets);
  } catch (error) {
    throw new Error('Error al obtener estadísticas: ' + error.message);
  }
}

// Función para crear usuarios de prueba si no existen
async function createTestUsers() {
  console.log('👥 Creando usuarios de prueba...');
  
  try {
    // Crear usuario administrador
    await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      username: 'admin',
      password: 'admin123',
      email: 'admin@test.com',
      role: 'admin'
    });
    console.log('✅ Usuario administrador creado');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Usuario administrador ya existe');
    } else {
      console.log('⚠️ Error al crear usuario administrador:', error.message);
    }
  }
  
  try {
    // Crear usuario normal
    await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      username: 'usuario',
      password: 'usuario123',
      email: 'usuario@test.com',
      role: 'user'
    });
    console.log('✅ Usuario normal creado');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Usuario normal ya existe');
    } else {
      console.log('⚠️ Error al crear usuario normal:', error.message);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas del sistema de lotería...\n');
  
  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor conectado correctamente');
  } catch (error) {
    console.error('❌ No se puede conectar al servidor. Asegúrate de que esté corriendo.');
    console.error('   URL:', BASE_URL);
    process.exit(1);
  }
  
  // Crear usuarios de prueba
  await createTestUsers();
  
  // Ejecutar pruebas
  await testLotterySystem();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testLotterySystem,
  createTestUsers
}; 