const fetch = require('node-fetch');

async function testJWTToken() {
  console.log('🔐 Probando token JWT con rol...');
  
  try {
    // 1. Hacer login para obtener token
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'matias4315@gmail.com',
        password: 'w35115415'
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.log('❌ Error en login:', await loginResponse.text());
      return;
    }
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('Token recibido:', loginResult.token ? 'SÍ' : 'NO');
    
    if (loginResult.user) {
      console.log('Usuario:', {
        id: loginResult.user.id,
        nombre: loginResult.user.nombre,
        email: loginResult.user.email,
        rol: loginResult.user.rol
      });
    }
    
    // 2. Probar endpoint de administración con token
    console.log('\n2️⃣ Probando endpoint de administración...');
    const adminResponse = await fetch('http://localhost:3001/api/v1/surveys/8', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginResult.token}`
      },
      body: JSON.stringify({
        question: '¿Cuál es tu color favorito actualizado?'
      })
    });
    
    console.log(`Status: ${adminResponse.status}`);
    console.log(`Status Text: ${adminResponse.statusText}`);
    
    const adminResult = await adminResponse.json();
    console.log('Response:', JSON.stringify(adminResult, null, 2));
    
    if (adminResponse.ok) {
      console.log('✅ Endpoint de administración funcionando correctamente');
    } else {
      console.log('❌ Error en endpoint de administración:', adminResult.error);
    }
    
    // 3. Probar endpoint sin token (debe fallar)
    console.log('\n3️⃣ Probando endpoint sin token...');
    const noTokenResponse = await fetch('http://localhost:3001/api/v1/surveys/8', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: 'Encuesta Sin Token'
      })
    });
    
    console.log(`Status: ${noTokenResponse.status}`);
    const noTokenResult = await noTokenResponse.json();
    console.log('Response:', JSON.stringify(noTokenResult, null, 2));
    
    if (noTokenResponse.status === 401) {
      console.log('✅ Autenticación funcionando correctamente (sin token = 401)');
    }
    
    // 4. Verificar token JWT manualmente
    console.log('\n4️⃣ Verificando estructura del token...');
    if (loginResult.token) {
      const tokenParts = loginResult.token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Token payload:', {
            id: payload.id,
            email: payload.email,
            rol: payload.rol,
            iat: payload.iat,
            exp: payload.exp
          });
          
          if (payload.rol) {
            console.log('✅ Rol incluido en token:', payload.rol);
          } else {
            console.log('❌ Rol NO incluido en token');
          }
        } catch (error) {
          console.log('❌ Error decodificando token:', error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testJWTToken()
    .then(() => {
      console.log('\n🏁 Prueba completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = testJWTToken; 