const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Test simple del endpoint de perfil
 */

async function testProfileEndpoint() {
  console.log('🧪 Iniciando test del endpoint de perfil...');
  
  // Generar token válido
  const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
  const testUser = {
    id: 1,
    email: 'test@example.com',
    rol: 'usuario'
  };
  
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
  console.log('🔑 Token generado para usuario ID 1');
  
  try {
    // Test 1: Sin token
    console.log('\n📋 Test 1: Sin autenticación');
    try {
      const response1 = await axios.get('http://localhost:3001/api/v1/profile/me');
      console.log('❌ Debería haber fallado sin token');
    } catch (error) {
      console.log('✅ Correctamente rechazado sin token:', error.response?.status);
    }
    
    // Test 2: Con token válido
    console.log('\n📋 Test 2: Con token válido');
    try {
      const response2 = await axios.get('http://localhost:3001/api/v1/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Respuesta exitosa:');
      console.log('Status:', response2.status);
      console.log('Data:', JSON.stringify(response2.data, null, 2));
      
    } catch (error) {
      console.log('❌ Error con token válido:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      
      if (error.response?.status === 500) {
        console.log('\n🔍 Error 500 detectado - revisar logs del servidor');
      }
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar test
testProfileEndpoint()
  .then(() => console.log('\n✅ Test completado'))
  .catch(error => console.log('\n❌ Error en test:', error.message)); 