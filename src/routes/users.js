const { authenticate } = require('../middlewares/auth');
const pool = require('../config/database');

/**
 * Configura las rutas de usuarios
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function userRoutes(fastify, options) {
  // Obtener perfil del usuario autenticado
  fastify.get('/api/v1/users/profile', {
    onRequest: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      const [users] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const user = users[0];
      delete user.password; // No enviar la contraseña
      delete user.role_id; // No enviar el ID del rol

      reply.send(user);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener el perfil' });
    }
  });
}

module.exports = userRoutes; 