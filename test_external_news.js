const axios = require('axios');

// Test script for external news injection
async function testExternalNewsInjection() {
  const baseURL = 'http://localhost:3001';
  const apiKey = 'tu_api_key_super_seguro_para_externo'; // Use the same as in config

  const testData = {
    titulo: 'Noticia de prueba desde sitio esclavo',
    descripcion: 'Esta es una noticia inyectada desde otro sitio web usando la API externa.',
    image_url: 'https://example.com/image.jpg',
    original_url: 'https://sitio-esclavo.com/noticia',
    is_oficial: false
  };

  try {
    console.log('🧪 Probando inyección de noticia externa...');
    console.log('URL:', `${baseURL}/api/v1/news/external`);
    console.log('API Key:', apiKey);
    console.log('Datos:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${baseURL}/api/v1/news/external`, testData, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta exitosa:', response.status);
    console.log('Datos de respuesta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.status, error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testExternalNewsInjection();