const { authenticate, authorize } = require('../middlewares/auth');

/**
 * Plugin de Fastify para las rutas de documentación interna de la API.
 * @param {FastifyInstance} fastify - Instancia de Fastify.
 * @param {Object} options - Opciones del plugin.
 */
async function docsRoutes(fastify, options) {

  fastify.get('/api/v1/docs/endpoints', {
    onRequest: [authenticate, authorize(['administrador'])], // Solo administradores
    schema: {
      tags: ['Documentación'], // Etiqueta para Swagger UI
      summary: 'Obtener la lista de todos los endpoints de la API',
      description: 'Devuelve una lista de todos los paths y métodos disponibles en la API, extraídos de la especificación OpenAPI generada.',
      response: {
        200: {
          description: 'Lista de endpoints exitosa',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', description: 'Método HTTP' },
              path: { type: 'string', description: 'Ruta del endpoint' },
              summary: { type: 'string', nullable: true, description: 'Resumen del endpoint (del schema OpenAPI)' },
              tags: { type: 'array', items: { type: 'string' }, nullable: true, description: 'Etiquetas asociadas (del schema OpenAPI)'}
            }
          }
        },
        500: {
          description: 'Error del servidor',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    if (!fastify.swagger || typeof fastify.swagger !== 'function') {
      request.log.error('fastify.swagger() no está disponible o no es una función.');
      return reply.status(500).send({ error: 'Swagger no está disponible para generar la lista de endpoints.' });
    }

    try {
      const openApiSchema = fastify.swagger(); // Obtener el esquema OpenAPI completo
      const endpoints = [];

      if (openApiSchema && openApiSchema.paths) {
        for (const pathKey in openApiSchema.paths) {
          for (const methodKey in openApiSchema.paths[pathKey]) {
            const endpointInfo = openApiSchema.paths[pathKey][methodKey];
            endpoints.push({
              method: methodKey.toUpperCase(),
              path: pathKey,
              summary: endpointInfo.summary || '',
              tags: endpointInfo.tags || []
            });
          }
        }
      }

      // Ordenar para una mejor visualización (opcional, pero útil)
      endpoints.sort((a, b) => {
        if (a.path < b.path) return -1;
        if (a.path > b.path) return 1;
        if (a.method < b.method) return -1;
        if (a.method > b.method) return 1;
        return 0;
      });

      return endpoints;
    } catch (error) {
      request.log.error({ error: error, message: 'Error al generar la lista de endpoints desde Swagger' }, error.message);
      return reply.status(500).send({ error: 'Ocurrió un error al procesar la especificación OpenAPI.' });
    }
  });

  // Nota: El endpoint /api/v1/docs/json es registrado automáticamente por @fastify/swagger-ui
  // No es necesario registrarlo manualmente aquí
}

module.exports = docsRoutes; 