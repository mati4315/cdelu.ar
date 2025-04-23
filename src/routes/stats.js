const pool = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * Configura las rutas de estadísticas
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function statsRoutes(fastify, options) {
  // Obtener estadísticas generales
  fastify.get('/api/v1/stats', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            totalNoticias: { type: 'integer' },
            totalUsuarios: { type: 'integer' },
            totalComentarios: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Obtener total de noticias
      const [noticias] = await pool.query('SELECT COUNT(*) as total FROM news');
      
      // Obtener total de usuarios
      const [usuarios] = await pool.query('SELECT COUNT(*) as total FROM users');
      
      // Obtener total de comentarios
      const [comentarios] = await pool.query('SELECT COUNT(*) as total FROM comments');

      reply.send({
        totalNoticias: noticias[0].total,
        totalUsuarios: usuarios[0].total,
        totalComentarios: comentarios[0].total
      });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener estadísticas' });
    }
  });
}

module.exports = statsRoutes; 