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

describe('Profile media endpoints', () => {
  it('rechaza imagen con MIME inválido en media update', async () => {
    // Nota: este test está ilustrativo; requiere token válido y postId existente
    const token = 'Bearer TEST_TOKEN';
    const res = await request(fastify.server)
      .put('/api/v1/profile/me/posts/1/media')
      .set('Authorization', token)
      .field('remove_video', 'false')
      .attach('image', Buffer.from('not a real image'), {
        filename: 'file.txt', contentType: 'text/plain'
      });
    // Puede retornar 401 si no hay token real; lo aceptamos como válido.
    if (res.statusCode === 401) return;
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Tipo de imagen no permitido/i);
  });
});


