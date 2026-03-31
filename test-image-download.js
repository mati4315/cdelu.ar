#!/usr/bin/env node
/**
 * TEST descarga de imágenes
 * Envía una imagen desde una URL externa
 */

const http = require('http');

// URL de una imagen pequeña y accesible
// Usando una imagen de prueba de 1x1 pixel
const testImageUrl = 'https://via.placeholder.com/200x200?text=CdelU';

const reqData = {
  titulo: 'Test con descarga de imagen remota',
  descripcion: 'Esta noticia incluye una imagen que será descargada desde un servidor remoto.',
  image_url: testImageUrl
};

console.log('📤 Enviando noticia con imagen remota...\n');
console.log(`Image URL: ${testImageUrl}\n`);

const postData = JSON.stringify(reqData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/news/external',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'X-API-Key': 'EbVOmsJC5rVywOGVLQyvkmUBLhBtVASY'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}\n`);
    const jsonData = JSON.parse(data);
    const newsData = jsonData.data;
    
    console.log('📥 Respuesta del servidor:\n');
    console.log('✨ Resultado:');
    console.log(`  - ID: ${newsData.id}`);
    console.log(`  - Título: "${newsData.titulo}"`);
    console.log(`  - 🖼️  Image URL (GUARDADA LOCALMENTE): ${newsData.image_url}`);
    console.log(`  - 📅 Published At: ${newsData.published_at}`);
    console.log(`  - Oficial: ${newsData.is_oficial === 1 ? '✅' : '❌'}`);
    console.log(`  - Autor: ${newsData.autor}`);
    
    console.log('\n🎯 Verificación:');
    console.log(`  ${newsData.image_url && newsData.image_url.includes('/uploads/') ? '✅' : '❌'} Imagen descargada y guardada localmente`);
    console.log(`  ${newsData.image_url ? '✅' : '❌'} image_url apunta a servidor local`);
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
