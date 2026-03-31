const http = require('http');

const complexData = {
    "titulo": "Noticia con campos complejos WordPress " + Date.now(),
    "original_url": "https://wordpress.test/full-post-example/",
    "is_oficial": true,
    "category": "Actualidad",
    "tags": ["prueba", "automatica"],
    "author": "matias4315",
    "publish_date": "2026-03-27 12:25:23",
    "custom_fields": {
        "img_miniatura": "https://wordpress.test/uploads/mini.jpg",
        "img_miniatura2": "",
        "wp_automatic_camp": "7",
        "original_link": "https://wordpress.test/link-original/",
        "img": "https://wordpress.test/uploads/big.jpg",
        "diario": "El Miércoles Digital",
        "categoria": "Locales",
        "link_post": "https://wordpress.test/noticia-final/"
    }
};

const postData = JSON.stringify(complexData);

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
