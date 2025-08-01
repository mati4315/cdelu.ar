const fetch = require('node-fetch');

async function testAPI() {
    console.log('🧪 Probando API del servidor...');
    
    try {
        // Probar login
        console.log('📝 Probando login...');
        const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'password'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login response:', loginData);
        
        if (loginData.token) {
            // Probar endpoint protegido
            console.log('📝 Probando endpoint protegido...');
            const feedResponse = await fetch('http://localhost:3001/api/v1/feed', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`
                }
            });
            
            const feedData = await feedResponse.json();
            console.log('✅ Feed response:', feedData);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI(); 