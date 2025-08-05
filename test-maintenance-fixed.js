const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testMaintenanceFixed() {
  console.log('🧪 Probando funciones de mantenimiento corregidas...\n');

  try {
    // 1. Hacer login para obtener token
    console.log('1️⃣ Haciendo login para obtener token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'matias4315@gmail.com',
      password: 'w35115415'
    });
    
    if (loginResponse.data.token) {
      const authToken = loginResponse.data.token;
      console.log('✅ Login exitoso, token obtenido');
      
      // 2. Probar endpoint de purgar caché con body
      console.log('\n2️⃣ Probando POST /admin/purge-cache con body...');
      try {
        const purgeResponse = await axios.post(`${BASE_URL}/admin/purge-cache`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Caché purgada exitosamente');
        console.log('📋 Respuesta:', purgeResponse.data);
      } catch (error) {
        console.log('❌ Error purgando caché:', error.response?.status, error.response?.data || error.message);
      }

      // 3. Probar endpoint de optimizar BD con body
      console.log('\n3️⃣ Probando POST /admin/database/optimize con body...');
      try {
        const optimizeResponse = await axios.post(`${BASE_URL}/admin/database/optimize`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ BD optimizada exitosamente');
        console.log('📋 Respuesta:', optimizeResponse.data);
      } catch (error) {
        console.log('❌ Error optimizando BD:', error.response?.status, error.response?.data || error.message);
      }

      // 4. Probar endpoint de limpiar logs con body
      console.log('\n4️⃣ Probando POST /admin/system/clear-logs con body...');
      try {
        const logsResponse = await axios.post(`${BASE_URL}/admin/system/clear-logs`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Logs limpiados exitosamente');
        console.log('📋 Respuesta:', logsResponse.data);
      } catch (error) {
        console.log('❌ Error limpiando logs:', error.response?.status, error.response?.data || error.message);
      }

      // 5. Probar endpoint de bloquear IPs con body
      console.log('\n5️⃣ Probando POST /admin/security/block-ips con body...');
      try {
        const blockIPsResponse = await axios.post(`${BASE_URL}/admin/security/block-ips`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ IPs bloqueadas exitosamente');
        console.log('📋 Respuesta:', blockIPsResponse.data);
      } catch (error) {
        console.log('❌ Error bloqueando IPs:', error.response?.status, error.response?.data || error.message);
      }

      console.log('\n🎉 Pruebas de funciones corregidas completadas');

    } else {
      console.log('❌ Error en login:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testMaintenanceFixed(); 