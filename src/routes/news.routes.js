const newsController = require('../controllers/news.controller');

/**
 * Esquemas de validación para las rutas de noticias
 */
const schemas = {
  // Esquema para crear/actualizar noticia
  newsSchema: {
    type: 'object',
    required: ['titulo', 'descripcion'],
    properties: {
      titulo: { type: 'string', minLength: 1 },
      descripcion: { type: 'string', minLength: 1 },
      image_url: { type: 'string', format: 'uri', nullable: true },
      original_url: { type: 'string', format: 'uri', nullable: true },
      is_oficial: { type: 'boolean', default: true }
    }
  },
  // Esquema para respuesta de noticia
  newsResponse: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      resumen: { type: 'string', nullable: true },
      image_url: { type: 'string', nullable: true },
      original_url: { type: 'string', nullable: true },
      published_at: { type: 'string', format: 'date-time', nullable: true },
      is_oficial: { type: 'boolean' },
      created_by: { type: 'number', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de noticias
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function newsRoutes(fastify, options) {
  // Crear noticia
  fastify.post('/news', {
    schema: {
      body: schemas.newsSchema,
      response: {
        201: schemas.newsResponse
      }
    }
  }, newsController.create);

  // Obtener noticia por ID
  fastify.get('/news/:id', {
    schema: {
      response: {
        200: schemas.newsResponse
      }
    }
  }, newsController.getById);

  // Actualizar noticia
  fastify.put('/news/:id', {
    schema: {
      body: schemas.newsSchema,
      response: {
        200: schemas.newsResponse
      }
    }
  }, newsController.update);

  // Eliminar noticia
  fastify.delete('/news/:id', {
    schema: {
      response: {
        204: {
          type: 'null',
          description: 'Noticia eliminada correctamente'
        }
      }
    }
  }, newsController.delete);
}

module.exports = newsRoutes; 