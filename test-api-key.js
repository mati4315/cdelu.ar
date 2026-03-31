const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Probando endpoint de debug...');

    const debugResponse = await axios.get('http://localhost:3001/debug/env');
    console.log('📊 Variables de entorno:', JSON.stringify(debugResponse.data, null, 2));

    console.log('\n🧪 Probando API Key...');

    const response = await axios.post('http://localhost:3001/api/v1/news/external', {
      titulo: 'Test desde Node.js',
      descripcion: 'Verificando API Key después de reinicio',
      is_oficial: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'EbVOmsJC5rVywOGVLQyvkmUBLhBtVASY'
      },
      timeout: 5000
    });

    console.log('✅ ÉXITO:', response.status);
    console.log('📄 Respuesta:', response.data);

  } catch (error) {
    console.log('❌ ERROR:', error.response?.status, error.response?.data || error.message);
  }
}

testAPI();