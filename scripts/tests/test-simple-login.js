const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogin(email, password) {
    try {
        console.log(`🔐 Probando login con: ${email}`);
        
        const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: email,
            password: password
        });
        
        console.log('✅ Login exitoso!');
        console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
        console.log(`   Usuario: ${response.data.user.nombre}`);
        console.log(`   Rol: ${response.data.user.rol}`);
        
        return response.data.token;
        
    } catch (error) {
        console.log(`❌ Login falló: ${error.response?.data?.error || error.message}`);
        return null;
    }
}

async function testAllLogins() {
    console.log('🧪 Probando diferentes credenciales...\n');
    
    const credentials = [
        { email: 'admin@trigamer.net', password: 'admin123' },
        { email: 'admin@trigamer.net', password: 'admin' },
        { email: 'admin@trigamer.net', password: 'password' },
        { email: 'test@trigamer.net', password: 'test123' },
        { email: 'test@trigamer.net', password: 'password' },
        { email: 'matias4315@gmail.com', password: 'matias123' },
        { email: 'admin@cdelu.ar', password: 'admin123' },
        { email: 'admin@cdelu.ar', password: 'admin' }
    ];
    
    for (const cred of credentials) {
        const token = await testLogin(cred.email, cred.password);
        if (token) {
            console.log('\n🎯 ¡Credenciales válidas encontradas!');
            console.log(`   Email: ${cred.email}`);
            console.log(`   Password: ${cred.password}`);
            return { email: cred.email, password: cred.password, token };
        }
        console.log('---');
    }
    
    console.log('\n❌ No se encontraron credenciales válidas');
    return null;
}

// Ejecutar la prueba
testAllLogins(); 