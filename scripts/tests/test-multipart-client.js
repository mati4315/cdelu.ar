const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testMultipartStructure() {
  console.log('🧪 Probando estructura de multipart...\n');

  try {
    // Crear imagen de prueba
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x82, 0x84, 0x83, 0x91, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const tempImagePath = './temp-debug-image.png';
    fs.writeFileSync(tempImagePath, pngData);
    console.log('✅ Imagen de prueba creada');

    // Crear FormData
    const form = new FormData();
    form.append('profile_picture', fs.createReadStream(tempImagePath), {
      filename: 'test-debug.png',
      contentType: 'image/png'
    });

    // Enviar a servidor de test
    console.log('🚀 Enviando a servidor de debug...');
    const response = await axios.post('http://localhost:3002/test-upload', form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    console.log('✅ Respuesta del servidor de debug:');
    console.log(JSON.stringify(response.data, null, 2));

    // Limpiar
    fs.unlinkSync(tempImagePath);
    console.log('🧹 Archivo temporal eliminado');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Esperar un poco para que el servidor se inicie
setTimeout(testMultipartStructure, 2000); 