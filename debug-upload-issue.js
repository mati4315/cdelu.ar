const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Script para debuggear el problema de subida de archivos
 */

async function debugUploadIssue() {
  console.log('🔍 Debuggeando problema de subida de archivos...\n');

  // Generar token válido
  const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
  const testUser = {
    id: 1,
    email: 'test@example.com',
    rol: 'usuario'
  };
  
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
  
  try {
    // Crear una imagen de prueba simple (1x1 pixel PNG)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x82, 0x84, 0x83, 0x91, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND chunk
    ]);

    // Guardar imagen temporal
    const tempImagePath = './temp-test-image.png';
    fs.writeFileSync(tempImagePath, pngData);
    console.log('✅ Imagen de prueba creada:', tempImagePath);
    console.log('📊 Tamaño de imagen:', pngData.length, 'bytes');

    // Crear FormData
    const form = new FormData();
    form.append('profile_picture', fs.createReadStream(tempImagePath), {
      filename: 'test-profile.png',
      contentType: 'image/png'
    });

    console.log('\n🚀 Enviando petición...');
    
    // Realizar petición
    const response = await axios.post('http://localhost:3001/api/v1/profile/picture', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.log('\n❌ Error detectado:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Full error:', error.response?.data || error.message);
    
    // Si hay error de servidor, mostrar detalles
    if (error.response?.status === 500) {
      console.log('\n🔍 Error 500 - Posibles causas:');
      console.log('1. Problema en saveProfilePicture con fileData.file.read()');
      console.log('2. Estructura de archivo incorrecta en fastify-multipart');
      console.log('3. Buffer null en verificación de tamaño');
    }
  }

  // Limpiar archivo temporal
  try {
    if (fs.existsSync('./temp-test-image.png')) {
      fs.unlinkSync('./temp-test-image.png');
      console.log('\n🧹 Archivo temporal eliminado');
    }
  } catch (cleanupError) {
    console.log('\n⚠️  Error al limpiar archivo temporal:', cleanupError.message);
  }
}

// Ejecutar debug
debugUploadIssue()
  .then(() => console.log('\n✅ Debug completado'))
  .catch(error => console.log('\n❌ Error en debug:', error.message)); 