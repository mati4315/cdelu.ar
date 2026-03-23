const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testMaintenanceFunctions() {
  console.log('🧪 Probando funciones de mantenimiento...\n');

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
      
      // 2. Probar purgar caché
      console.log('\n2️⃣ Probando purgar caché...');
      try {
        const purgeResponse = await axios.post(`${BASE_URL}/admin/purge-cache`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Caché purgada exitosamente');
        console.log('📋 Respuesta:', purgeResponse.data);
      } catch (error) {
        console.log('❌ Error purgando caché:', error.response?.data || error.message);
      }

      // 3. Probar verificar estado de BD
      console.log('\n3️⃣ Probando verificar estado de BD...');
      try {
        const dbStatusResponse = await axios.get(`${BASE_URL}/admin/database/status`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Estado de BD verificado');
        console.log('📋 Respuesta:', dbStatusResponse.data);
      } catch (error) {
        console.log('❌ Error verificando BD:', error.response?.data || error.message);
      }

      // 4. Probar optimizar BD
      console.log('\n4️⃣ Probando optimizar BD...');
      try {
        const optimizeResponse = await axios.post(`${BASE_URL}/admin/database/optimize`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ BD optimizada exitosamente');
        console.log('📋 Respuesta:', optimizeResponse.data);
      } catch (error) {
        console.log('❌ Error optimizando BD:', error.response?.data || error.message);
      }

      // 5. Probar crear backup
      console.log('\n5️⃣ Probando crear backup...');
      try {
        const backupResponse = await axios.post(`${BASE_URL}/admin/database/backup`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Backup creado exitosamente');
        console.log('📋 Respuesta:', backupResponse.data);
      } catch (error) {
        console.log('❌ Error creando backup:', error.response?.data || error.message);
      }

      // 6. Probar verificar estado del sistema
      console.log('\n6️⃣ Probando verificar estado del sistema...');
      try {
        const systemResponse = await axios.get(`${BASE_URL}/admin/system/status`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Estado del sistema verificado');
        console.log('📋 Respuesta:', systemResponse.data);
      } catch (error) {
        console.log('❌ Error verificando sistema:', error.response?.data || error.message);
      }

      // 7. Probar limpiar logs
      console.log('\n7️⃣ Probando limpiar logs...');
      try {
        const logsResponse = await axios.post(`${BASE_URL}/admin/system/clear-logs`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Logs limpiados exitosamente');
        console.log('📋 Respuesta:', logsResponse.data);
      } catch (error) {
        console.log('❌ Error limpiando logs:', error.response?.data || error.message);
      }

      // 8. Probar verificar seguridad
      console.log('\n8️⃣ Probando verificar seguridad...');
      try {
        const securityResponse = await axios.get(`${BASE_URL}/admin/security/status`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Estado de seguridad verificado');
        console.log('📋 Respuesta:', securityResponse.data);
      } catch (error) {
        console.log('❌ Error verificando seguridad:', error.response?.data || error.message);
      }

      console.log('\n🎉 Pruebas de mantenimiento completadas');

    } else {
      console.log('❌ Error en login:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testMaintenanceFunctions(); 