const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testVoteAuthentication() {
  console.log('🧪 Probando autenticación en endpoint de votación...\n');

  try {
    // 1. Probar votar sin token (debe fallar)
    console.log('1️⃣ Probando votar sin token (debe fallar)...');
    try {
      const voteData = {
        option_ids: [57] // ID de la primera opción de la encuesta 17
      };
      
      const noAuthResponse = await axios.post(`${BASE_URL}/surveys/17/vote`, voteData);
      console.log('❌ ERROR: Debería haber fallado sin token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correcto: Voto sin token rechazado');
        console.log('📋 Respuesta:', error.response.data);
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    // 2. Hacer login para obtener token
    console.log('\n2️⃣ Haciendo login para obtener token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'matias4315@gmail.com',
      password: 'w35115415'
    });
    
    if (loginResponse.data.token) {
      const authToken = loginResponse.data.token;
      console.log('✅ Login exitoso, token obtenido');
      
      // 3. Probar votar con token (debe funcionar)
      console.log('\n3️⃣ Probando votar con token...');
      const voteData = {
        option_ids: [57] // ID de la primera opción de la encuesta 17
      };
      
      const authResponse = await axios.post(`${BASE_URL}/surveys/17/vote`, voteData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Voto con token exitoso');
      console.log('📋 Respuesta:', authResponse.data);
      
      // 4. Probar votar nuevamente (debe fallar por duplicado)
      console.log('\n4️⃣ Probando votar nuevamente (debe fallar)...');
      try {
        const duplicateResponse = await axios.post(`${BASE_URL}/surveys/17/vote`, voteData, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('❌ ERROR: Debería haber fallado por voto duplicado');
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Correcto: Voto duplicado rechazado');
          console.log('📋 Respuesta:', error.response.data);
        } else {
          console.log('❌ Error inesperado:', error.response?.data || error.message);
        }
      }
      
    } else {
      console.log('❌ Error en login:', loginResponse.data);
    }

    console.log('\n🎉 Prueba de autenticación completada');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testVoteAuthentication(); 