/**
 * Middleware de autenticación
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'No autorizado' });
  }
}

/**
 * Middleware de autorización por rol
 * @param {string[]} roles - Roles permitidos
 */
function authorize(roles) {
  return async (request, reply) => {
    try {
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ error: 'No tienes permiso para realizar esta acción' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'No autorizado' });
    }
  };
}

module.exports = {
  authenticate,
  authorize
}; 