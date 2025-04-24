/**
 * Middleware de autenticación
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function authenticate(request, reply) {
  try {
    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'No autorizado' });
  }
}

/**
 * Middleware de autorización por rol
 * @param {string[]} roles - Roles permitidos
 */
function authorize(roles) {
  return async (request, reply) => {
    try {
      if (!request.user || !request.user.role) {
        return reply.status(401).send({ error: 'No autorizado' });
      }

      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ error: 'No tienes permiso para realizar esta acción' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'No autorizado' });
    }
  };
}

module.exports = {
  authenticate,
  authorize
}; 