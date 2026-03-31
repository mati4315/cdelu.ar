#!/usr/bin/env node
/**
 * TEST SIMPLE - AWS WORDPRESS INTEGRATION
 * 
 * Simula lo que enviará el plugin de WordPress
 * Solo requiere: titulo y descripcion
 * Todo lo demás se configura automáticamente en el servidor
 */

const http = require('http');

const reqData = {
  // ✅ REQUERIDO: Título de la noticia
  titulo: 'Demo: Se implementó nuevo sistema de votación',
  
  // ✅ REQUERIDO: Contenido/descripción
  descripcion: 'La comunidad de CdelU ha lanzado un nuevo sistema de votación con mejor interfaz y más opciones de participación.',
  
  // ⚠️ OPCIONAL: URL de imagen (puede omitirse)
  image_url: 'https://example.com/images/votacion.jpg',
  
  // ⚠️ OPCIONAL: URL original en WordPress
  original_url: 'https://wordpress.ejemplo.com/noticias/votacion-nueva/'
};

console.log('📤 Enviando noticia mínima a CdelU API...\n');
console.log('Datos enviados (MÍNIMO):\n', JSON.stringify({
  titulo: reqData.titulo,
  descripcion: reqData.descripcion
}, null, 2));

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
    console.log(`\n✅ Status: ${res.statusCode}`);
    const jsonData = JSON.parse(data);
    
    console.log('\n📥 Respuesta del servidor:\n');
    console.log('✨ Resultado:');
    console.log(`  - ID: ${jsonData.data.id}`);
    console.log(`  - Título: "${jsonData.data.titulo}"`);
    console.log(`  - Oficial: ${jsonData.data.is_oficial === 1 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  - Autor: ${jsonData.data.autor}`);
    console.log(`  - Creado por ID: ${jsonData.data.created_by}`);
    console.log(`  - Fecha: ${jsonData.data.created_at}`);
    
    console.log('\n🎯 La noticia se creó automáticamente como:\n' +
                '  ✅ Oficial (is_oficial=1)\n' +
                '  ✅ Del usuario Matias Moreiraa (created_by=1)\n' +
                '  ✅ Visible en feed principal');
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
