const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');

async function simpleUploadTest() {
  console.log('🔧 Test simple de upload...\n');

  try {
    // 1. Verificar servidor
    console.log('📋 1. Verificando servidor...');
    const statusResponse = await axios.get('http://localhost:3001/api/v1/status');
    console.log('✅ Servidor activo:', statusResponse.status);

    // 2. Generar token
    console.log('\n📋 2. Generando token...');
    const JWT_SECRET = 'tu_secreto_super_seguro';
    const token = jwt.sign({ id: 1, email: 'test@example.com', rol: 'usuario' }, JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ Token generado');

    // 3. Crear imagen mínima
    console.log('\n📋 3. Creando imagen de prueba...');
    const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('./minimal-test.png', minimalPNG);
    console.log('✅ Imagen creada:', minimalPNG.length, 'bytes');

    // 4. Crear FormData
    console.log('\n📋 4. Preparando FormData...');
    const formData = new FormData();
    formData.append('profile_picture', fs.createReadStream('./minimal-test.png'), {
      filename: 'minimal-test.png',
      contentType: 'image/png'
    });
    console.log('✅ FormData preparado');

    // 5. Enviar petición
    console.log('\n📋 5. Enviando petición...');
    console.log('URL:', 'http://localhost:3001/api/v1/profile/picture');
    console.log('Headers Authorization:', `Bearer ${token.substring(0, 20)}...`);

    const response = await axios.post(
      'http://localhost:3001/api/v1/profile/picture', 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      }
    );

    console.log('\n🎉 ¡ÉXITO!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.log('\n❌ ERROR DETALLADO:');
    console.log('Error type:', error.constructor.name);
    console.log('Message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      console.log('Response headers:', error.response.headers);
    } else if (error.request) {
      console.log('Request made but no response received');
      console.log('Request:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
    
    console.log('Config:', error.config);
  } finally {
    // Limpiar
    try {
      fs.unlinkSync('./minimal-test.png');
      console.log('\n🧹 Limpieza completada');
    } catch (e) {}
  }
}

simpleUploadTest(); 