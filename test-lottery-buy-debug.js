const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1/lotteries`;

async function testLotteryBuy() {
    try {
        // 1. Primero obtener un token válido
        console.log('🔐 Obteniendo token...');
        const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'test@trigamer.net',
            password: 'password'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
        console.log('👤 Usuario:', loginResponse.data.user.nombre);
        console.log('🔑 Rol:', loginResponse.data.user.rol);
        
        // 2. Obtener loterías disponibles
        console.log('\n📋 Obteniendo loterías...');
        const lotteriesResponse = await axios.get(`${API_BASE}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const lotteries = lotteriesResponse.data.data;
        console.log(`✅ Encontradas ${lotteries.length} loterías`);
        
        // 3. Buscar una lotería activa diferente (no la 28)
        const activeLottery = lotteries.find(l => l.status === 'active' && l.id !== 28);
        if (!activeLottery) {
            console.log('❌ No hay loterías activas disponibles (excluyendo la 28)');
            return;
        }
        
        console.log(`🎯 Lotería seleccionada: ${activeLottery.title} (ID: ${activeLottery.id})`);
        console.log(`📅 Fecha inicio: ${activeLottery.start_date}`);
        console.log(`📅 Fecha fin: ${activeLottery.end_date}`);
        console.log(`💰 Es gratis: ${activeLottery.is_free}`);
        console.log(`🎫 Precio: $${activeLottery.ticket_price}`);
        
        // 4. Obtener tickets vendidos para ver números disponibles
        console.log('\n🎫 Obteniendo tickets vendidos...');
        const soldTicketsResponse = await axios.get(`${API_BASE}/${activeLottery.id}/sold-tickets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const soldTickets = soldTicketsResponse.data.data.ticket_numbers || [];
        console.log(`✅ Tickets vendidos: ${soldTickets.length}`);
        console.log(`📊 Números vendidos: [${soldTickets.join(', ')}]`);
        
        // 5. Encontrar números disponibles
        const maxTickets = activeLottery.max_tickets;
        const availableNumbers = [];
        for (let i = 1; i <= maxTickets; i++) {
            if (!soldTickets.includes(i)) {
                availableNumbers.push(i);
            }
        }
        
        console.log(`🎯 Números disponibles: [${availableNumbers.slice(0, 10).join(', ')}${availableNumbers.length > 10 ? '...' : ''}]`);
        
        if (availableNumbers.length === 0) {
            console.log('❌ No hay números disponibles para comprar');
            return;
        }
        
        // 6. Intentar comprar tickets
        const ticketNumbersToBuy = [availableNumbers[0]];
        console.log(`\n🛒 Intentando comprar ticket número: ${ticketNumbersToBuy[0]}`);
        
        const buyPayload = {
            ticket_numbers: ticketNumbersToBuy
        };
        
        console.log('📤 Payload enviado:', buyPayload);
        
        const buyResponse = await axios.post(`${API_BASE}/${activeLottery.id}/buy`, buyPayload, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Compra exitosa:', buyResponse.data);
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📋 Data:', error.response.data);
            console.error('🔍 Headers:', error.response.headers);
        }
        
        // Intentar obtener más información del error
        if (error.response?.data?.message) {
            console.error('💬 Mensaje de error:', error.response.data.message);
        }
    }
}

// Ejecutar la prueba
testLotteryBuy(); 