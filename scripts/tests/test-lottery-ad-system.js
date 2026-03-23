const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjZGVsdS5hciIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzQ4NjA5ODE0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

/**
 * Prueba completa del sistema de anuncios de lotería
 */
async function testLotteryAdSystem() {
    console.log('🧪 Iniciando pruebas del sistema de anuncios de lotería...\n');
    
    try {
        // 1. Verificar endpoint de loterías
        console.log('1️⃣ Probando endpoint de loterías...');
        const lotteriesResponse = await axios.get(`${BASE_URL}/lotteries?status=active`);
        
        if (lotteriesResponse.data.success) {
            console.log(`✅ Endpoint de loterías OK - ${lotteriesResponse.data.data.length} loterías encontradas`);
            
            const activeLotteries = lotteriesResponse.data.data.filter(l => 
                l.status === 'active' && l.current_status === 'running'
            );
            
            console.log(`📊 Loterías activas en ejecución: ${activeLotteries.length}`);
            
            if (activeLotteries.length > 0) {
                activeLotteries.forEach(lottery => {
                    console.log(`   - ${lottery.title} (ID: ${lottery.id})`);
                });
            }
        } else {
            console.log('❌ Error en endpoint de loterías');
            return;
        }
        
        // 2. Verificar endpoint de anuncios
        console.log('\n2️⃣ Probando endpoint de anuncios...');
        const adsResponse = await axios.get(`${BASE_URL}/ads`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (adsResponse.data.success) {
            console.log(`✅ Endpoint de anuncios OK - ${adsResponse.data.data.length} anuncios encontrados`);
            
            // Buscar anuncios de lotería existentes
            const lotteryAds = adsResponse.data.data.filter(ad => 
                ad.titulo.includes('🎰') && ad.categoria === 'eventos'
            );
            
            console.log(`📊 Anuncios de lotería existentes: ${lotteryAds.length}`);
            
            if (lotteryAds.length > 0) {
                lotteryAds.forEach(ad => {
                    console.log(`   - ${ad.titulo} (ID: ${ad.id}, Activo: ${ad.activo})`);
                });
            }
        } else {
            console.log('❌ Error en endpoint de anuncios');
            return;
        }
        
        // 3. Probar creación de anuncio de lotería
        console.log('\n3️⃣ Probando creación de anuncio de lotería...');
        
        const testAd = {
            titulo: "🎰 ¡Loterías Activas!",
            descripcion: "¡Participa en nuestras loterías activas con premios increíbles!",
            enlace_destino: "/lottery.html",
            texto_opcional: "Anuncio dinámico de lotería",
            categoria: "eventos",
            prioridad: 3,
            activo: true,
            impresiones_maximas: 0
        };
        
        const createResponse = await axios.post(`${BASE_URL}/ads`, testAd, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (createResponse.data.success) {
            console.log('✅ Anuncio de lotería creado exitosamente');
            console.log(`📋 ID del anuncio: ${createResponse.data.data.id}`);
            
            // 4. Probar actualización del anuncio
            console.log('\n4️⃣ Probando actualización del anuncio...');
            
            const updateData = {
                ...testAd,
                descripcion: "¡Actualizado! Participa en nuestras loterías activas con premios increíbles!",
                activo: false
            };
            
            const updateResponse = await axios.put(`${BASE_URL}/ads/${createResponse.data.data.id}`, updateData, {
                headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
            });
            
            if (updateResponse.data.success) {
                console.log('✅ Anuncio de lotería actualizado exitosamente');
            }
            
            // 5. Limpiar - eliminar anuncio de prueba
            console.log('\n5️⃣ Limpiando anuncio de prueba...');
            
            const deleteResponse = await axios.delete(`${BASE_URL}/ads/${createResponse.data.data.id}`, {
                headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
            });
            
            if (deleteResponse.data.success) {
                console.log('✅ Anuncio de prueba eliminado exitosamente');
            }
        }
        
        // 6. Probar endpoint público de anuncios activos
        console.log('\n6️⃣ Probando endpoint público de anuncios activos...');
        
        const publicAdsResponse = await axios.get(`${BASE_URL}/ads/active`);
        
        if (publicAdsResponse.data.data) {
            console.log(`✅ Endpoint público OK - ${publicAdsResponse.data.data.length} anuncios activos`);
            
            const activeLotteryAds = publicAdsResponse.data.data.filter(ad => 
                ad.titulo.includes('🎰')
            );
            
            console.log(`📊 Anuncios de lotería activos: ${activeLotteryAds.length}`);
        }
        
        console.log('\n✅ Todas las pruebas completadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    }
}

/**
 * Probar el script de gestión automática
 */
async function testAutoManagement() {
    console.log('\n🔄 Probando gestión automática...');
    
    try {
        const { manageLotteryAd } = require('./create-lottery-ad.js');
        await manageLotteryAd();
        
        console.log('✅ Gestión automática probada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en gestión automática:', error.message);
    }
}

// Ejecutar pruebas
async function runTests() {
    await testLotteryAdSystem();
    await testAutoManagement();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runTests();
}

module.exports = {
    testLotteryAdSystem,
    testAutoManagement
}; 