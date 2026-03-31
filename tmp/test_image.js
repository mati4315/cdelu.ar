const http = require('http');

const reqData = {
  titulo: 'Test INTEGRACION IMAGEN ' + Date.now(),
  descripcion: 'Contenido de prueba para verificar que la image_url se guarda correctamente.',
  image_url: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg',
  original_url: 'https://wordpress.test/noticia-con-imagen/'
};

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
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response body:', data);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(postData);
req.end();
