const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testAPI() {
    console.log('🧪 Probando API del servidor...');
    
    try {
        // Probar login
        console.log('📝 Probando login...');
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: 'test@test.com',
            password: 'password'
        });
        
        console.log('✅ Login response:', loginResponse);
        
        if (loginResponse.data && loginResponse.data.token) {
            // Probar endpoint protegido
            console.log('📝 Probando endpoint protegido...');
            const feedResponse = await makeRequest({
                hostname: 'localhost',
                port: 3001,
                path: '/api/v1/feed',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`
                }
            });
            
            console.log('✅ Feed response:', feedResponse);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI(); 