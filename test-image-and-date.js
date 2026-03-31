#!/usr/bin/env node
/**
 * TEST con imagen y verificación de published_at
 */

const http = require('http');

const reqData = {
  titulo: 'Test con imagen: Nuevo sistema de votación',
  descripcion: 'Se implementó un nuevo sistema de votación con mejor interfaz.',
  image_url: 'https://example.com/images/votacion.jpg'
};

console.log('📤 Enviando noticia CON IMAGEN...\n');

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
    console.log('✨ Campos verificados:');
    console.log(`  - ID: ${newsData.id}`);
    console.log(`  - Título: "${newsData.titulo}"`);
    console.log(`  - 🖼️  Image URL: ${newsData.image_url}`);
    console.log(`  - 📅 Published At: ${newsData.published_at}`);
    console.log(`  - Oficial: ${newsData.is_oficial === 1 ? '✅' : '❌'}`);
    console.log(`  - Autor: ${newsData.autor}`);
    
    console.log('\n🎯 Verificación:');
    console.log(`  ${newsData.image_url ? '✅' : '❌'} image_url guardado`);
    console.log(`  ${newsData.published_at ? '✅' : '❌'} published_at tiene fecha`);
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
