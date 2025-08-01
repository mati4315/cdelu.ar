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
            totalNews: { type: 'integer' },
            totalUsers: { type: 'integer' },
            totalComments: { type: 'integer' },
            totalCom: { type: 'integer' },
            totalFeed: { type: 'integer' },
            totalLikes: { type: 'integer' },
            totalComComments: { type: 'integer' }
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
      // Obtener total de comentarios en noticias
      const [comentarios] = await pool.query('SELECT COUNT(*) as total FROM comments');
      // Obtener total de comunidad
      const [comunidad] = await pool.query('SELECT COUNT(*) as total FROM com');
      // Obtener total del feed unificado
      const [feed] = await pool.query('SELECT COUNT(*) as total FROM content_feed');
      // Obtener total de likes (noticias + comunidad)
      const [likes] = await pool.query('SELECT (SELECT COUNT(*) FROM likes) + (SELECT COUNT(*) FROM com_likes) as total');
      // Obtener total de comentarios de comunidad
      const [comComments] = await pool.query('SELECT COUNT(*) as total FROM com_comments');

      /**
       * Respuesta con todos los datos para el dashboard
       * @type {{ totalNews: number, totalUsers: number, totalComments: number, totalCom: number, totalFeed: number, totalLikes: number, totalComComments: number }}
       */
      reply.send({
        totalNews: noticias[0].total,
        totalUsers: usuarios[0].total,
        totalComments: comentarios[0].total,
        totalCom: comunidad[0].total,
        totalFeed: feed[0].total,
        totalLikes: likes[0].total,
        totalComComments: comComments[0].total
      });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener estadísticas' });
    }
  });
}

module.exports = statsRoutes; 