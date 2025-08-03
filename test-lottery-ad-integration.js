const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjZGVsdS5hciIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzQ4NjA5ODE0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

/**
 * Prueba completa del sistema de anuncios de lotería
 */
async function testLotteryAdIntegration() {
    console.log('🧪 Iniciando pruebas de integración del sistema de anuncios de lotería...\n');
    
    try {
        // 1. Verificar que el worker está funcionando
        console.log('1️⃣ Verificando worker de anuncios de lotería...');
        
        const { manageLotteryAd } = require('./create-lottery-ad.js');
        await manageLotteryAd();
        
        console.log('✅ Worker ejecutado correctamente');
        
        // 2. Verificar loterías activas
        console.log('\n2️⃣ Verificando loterías activas...');
        
        const lotteriesResponse = await axios.get(`${BASE_URL}/lotteries?status=active`);
        
        if (lotteriesResponse.data.success) {
            const activeLotteries = lotteriesResponse.data.data.filter(l => 
                l.status === 'active' && l.current_status === 'running'
            );
            
            console.log(`📊 Loterías activas encontradas: ${activeLotteries.length}`);
            
            if (activeLotteries.length > 0) {
                activeLotteries.forEach(lottery => {
                    console.log(`   - ${lottery.title} (ID: ${lottery.id})`);
                });
            }
        }
        
        // 3. Verificar anuncios creados
        console.log('\n3️⃣ Verificando anuncios de lotería...');
        
        const adsResponse = await axios.get(`${BASE_URL}/ads?categoria=eventos`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (adsResponse.data.success) {
            const lotteryAds = adsResponse.data.data.filter(ad => 
                ad.titulo.includes('🎰') && ad.categoria === 'eventos'
            );
            
            console.log(`📊 Anuncios de lotería encontrados: ${lotteryAds.length}`);
            
            if (lotteryAds.length > 0) {
                lotteryAds.forEach(ad => {
                    console.log(`   - ${ad.titulo} (ID: ${ad.id}, Activo: ${ad.activo})`);
                });
            }
        }
        
        console.log('\n✅ Todas las pruebas completadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    }
}

// Ejecutar pruebas
async function runIntegrationTests() {
    console.log('🚀 Iniciando pruebas de integración...\n');
    await testLotteryAdIntegration();
    console.log('\n✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runIntegrationTests();
}

module.exports = {
    testLotteryAdIntegration
}; 