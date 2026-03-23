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
      // Función auxiliar para obtener conteo de manera segura
      const getCount = async (table) => {
        try {
          const [rows] = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
          return rows[0].total;
        } catch (e) {
          console.warn(`⚠️ Error al contar en tabla ${table}:`, e.message);
          return 0;
        }
      };

      const totalNews = await getCount('news');
      const totalUsers = await getCount('users');
      const totalComments = await getCount('comments');
      const totalCom = await getCount('com');
      const totalFeed = await getCount('content_feed');
      
      let totalLikes = 0;
      try {
        const [likes] = await pool.query('SELECT (SELECT COUNT(*) FROM likes) + (SELECT COUNT(*) FROM com_likes) as total');
        totalLikes = likes[0].total;
      } catch (e) {
        console.warn('⚠️ Error al contar likes:', e.message);
      }

      const totalComComments = await getCount('content_comments');

      reply.send({
        totalNews,
        totalUsers,
        totalComments,
        totalCom,
        totalFeed,
        totalLikes,
        totalComComments
      });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener estadísticas' });
    }
  });
}

module.exports = statsRoutes; 