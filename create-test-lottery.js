const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1/lotteries`;

async function createTestLottery() {
    try {
        // 1. Obtener token de administrador
        console.log('🔐 Obteniendo token de administrador...');
        const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'admin@trigamer.net',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
        console.log('👤 Usuario:', loginResponse.data.user.nombre);
        console.log('🔑 Rol:', loginResponse.data.user.rol);
        
        // 2. Crear nueva lotería
        console.log('\n🎯 Creando nueva lotería de prueba...');
        
        const now = new Date();
        const startDate = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hora desde ahora
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días desde ahora
        
        const lotteryData = {
            title: 'Lotería de Prueba',
            description: 'Lotería para probar la funcionalidad de compra de tickets',
            is_free: true,
            ticket_price: 0,
            min_tickets: 1,
            max_tickets: 50,
            num_winners: 1,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            prize_description: 'Premio de prueba',
            terms_conditions: 'Términos de prueba'
        };
        
        console.log('📤 Datos de la lotería:', lotteryData);
        
        const createResponse = await axios.post(API_BASE, lotteryData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Lotería creada:', createResponse.data);
        
        // 3. Activar la lotería
        const lotteryId = createResponse.data.data.id;
        console.log(`\n🚀 Activando lotería ID: ${lotteryId}`);
        
        const activateResponse = await axios.put(`${API_BASE}/${lotteryId}`, {
            status: 'active'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Lotería activada:', activateResponse.data);
        
        console.log(`\n🎉 Lotería de prueba creada y activada con ID: ${lotteryId}`);
        console.log('📅 Inicio:', startDate.toLocaleString());
        console.log('📅 Fin:', endDate.toLocaleString());
        console.log('💰 Gratis: Sí');
        console.log('🎫 Tickets máximos: 50');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📋 Data:', error.response.data);
        }
        
        if (error.response?.data?.message) {
            console.error('💬 Mensaje de error:', error.response.data.message);
        }
    }
}

createTestLottery(); 