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
  // Obtener lista paginada de noticias
  fastify.get('/news', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          sort: { type: 'string', enum: ['latest', 'oldest'] }
        }
      }
    }
  }, newsController.getAll);

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

  // Previsualizar noticias RSS (Frontend Modal)
  fastify.get('/news/rss/preview', {
    schema: {
      tags: ['Noticias'],
      summary: 'Obtiene las últimas noticias desde el feed RSS sin guardarlas'
    }
  }, async (request, reply) => {
    try {
      const rssService = require('../services/rssService');
      const news = await rssService.previewRSSNews();
      return reply.send({ success: true, data: news });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ 
          success: false, 
          message: 'Error al obtener RSS', 
          error: error.message 
      });
    }
  });

  // Importar noticia RSS con Server-Sent Events
  fastify.get('/news/import/stream', {
    schema: {
      tags: ['Noticias'],
      summary: 'Importa una noticia desde el RSS usando Server-Sent Events',
      querystring: {
        type: 'object',
        properties: {
          index: { type: 'integer', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    const index = request.query.index || 0;
    const rssService = require('../services/rssService');

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const sendEvent = (event, data) => {
      reply.raw.write(`event: ${event}\ndata: ${data}\n\n`);
    };

    try {
        await rssService.importNewsIndexedStream(index, sendEvent);
    } catch (error) {
        request.log.error(error);
        sendEvent('error', `Excepción no controlada: ${error.message}`);
        sendEvent('done', 'error');
    } finally {
        reply.raw.end();
    }
  });
}

module.exports = newsRoutes; 