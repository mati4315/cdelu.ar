const fetch = require('node-fetch');

async function testLogin() {
    console.log('🧪 Probando Login Real en Local (localhost:3001)...');
    try {
        const response = await fetch('http://localhost:3001/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'matias4315@gmail.com',
                password: '@35115415'
            })
        });

        const data = await response.json();
        if (response.ok && data.token) {
            console.log('✅ ÉXITO: Login correcto. Token recibido.');
            process.exit(0);
        } else {
            console.log('❌ FALLO:', data.error || 'Error desconocido');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ ERROR de conexión:', error.message);
        process.exit(1);
    }
}

testLogin();
