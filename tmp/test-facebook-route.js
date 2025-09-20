// Test rápido del endpoint Facebook Live sin levantar servidor
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const fastify = require('../src/app');
  try {
    await fastify.ready();
    const permalink = encodeURIComponent('https://www.facebook.com/marcelo.follonier.7/videos/2213713882398412');
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/v1/facebook/live-status?mock=true&permalink=${permalink}`
    });
    console.log('Status:', res.statusCode);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Error ejecutando test:', err);
  } finally {
    try { await fastify.close(); } catch {}
  }
}

main();


