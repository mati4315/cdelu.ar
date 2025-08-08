const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testUploadFix() {
  console.log('🧪 Probando corrección de upload...\n');

  // Generar token válido
  const JWT_SECRET = 'tu_secreto_super_seguro';
  const testUser = { id: 1, email: 'test@example.com', rol: 'usuario' };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

  try {
    // Crear imagen pequeña
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

    const tempPath = './temp-upload-test.png';
    fs.writeFileSync(tempPath, pngData);
    console.log('✅ Imagen de prueba creada:', pngData.length, 'bytes');

    // Crear FormData
    const form = new FormData();
    form.append('profile_picture', fs.createReadStream(tempPath), {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });

    console.log('🚀 Enviando petición de upload...');
    
    const response = await axios.post('http://localhost:3001/api/v1/profile/picture', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });

    console.log('\n✅ ¡ÉXITO! Upload funcionando:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n❌ Error en upload:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  // Limpiar
  try {
    if (fs.existsSync('./temp-upload-test.png')) {
      fs.unlinkSync('./temp-upload-test.png');
      console.log('\n🧹 Archivo temporal eliminado');
    }
  } catch (e) {}
}

testUploadFix().then(() => console.log('\n✅ Test completado')); 