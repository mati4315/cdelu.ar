const { authenticate, authorize } = require('../middlewares/auth');
const pool = require('../config/database');

/**
 * Configura las rutas de usuarios
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function userRoutes(fastify, options) {
  // Obtener todos los usuarios (solo admin)
  fastify.get('/api/v1/users', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [users] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id`
      );

      // No enviar información sensible
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }));

      return reply.send({ data: sanitizedUsers });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener usuarios' });
    }
  });

  // Obtener perfil del usuario actual
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
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [users] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [request.user.id]
      );

      if (users.length === 0) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const user = users[0];
      return reply.send({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener el perfil' });
    }
  });
}

module.exports = userRoutes; 