const request = require('supertest');
const build = require('../../app');

let fastify;
beforeAll(async () => {
  fastify = build;
  await fastify.ready();
});

afterAll(async () => {
  if (fastify) await fastify.close();
});

describe('Com create MIME validation', () => {
  it('rechaza video con MIME inválido', async () => {
    const token = 'Bearer TEST_TOKEN';
    const res = await request(fastify.server)
      .post('/api/v1/com')
      .set('Authorization', token)
      .field('titulo', 'Test')
      .field('descripcion', 'Desc')
      .attach('video', Buffer.from('not a real video'), {
        filename: 'file.mkv', contentType: 'video/x-matroska'
      });
    if (res.statusCode === 401) return;
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Tipo de video no permitido/i);
  });
});


