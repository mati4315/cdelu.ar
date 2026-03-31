const http = require('http');

function testFeed() {
  console.log('🔍 Probando API de feed directamente...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/feed?page=1&limit=10&sort=published_at&order=desc',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📊 Respuesta del backend:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.error('❌ Error al parsear JSON:', error);
        console.log('Respuesta raw:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
  });

  req.end();
}

testFeed();
