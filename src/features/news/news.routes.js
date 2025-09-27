"use strict";

// Rutas de News en estilo API v1, reutilizando paths actuales para no romper el frontend

const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./news.controller');

/**
 * Plugin de Fastify para las rutas de noticias (feature-based)
 * @param {import('fastify').FastifyInstance} fastify
 */
async function newsRoutes(fastify) {
  // GET /api/v1/news
  fastify.get('/api/v1/news', {
    schema: {
      tags: ['Noticias'],
      summary: 'Obtener todas las noticias',
      description: 'Lista paginada de noticias',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['titulo', 'created_at', 'likes_count', 'comments_count'], default: 'created_at' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
    },
  }, ctrl.getNews);

  // GET /api/v1/news/:id
  fastify.get('/api/v1/news/:id', {
    schema: {
      tags: ['Noticias'],
      summary: 'Obtener noticia por ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } },
      },
    },
  }, ctrl.getNewsById);

  // POST /api/v1/news
  fastify.post('/api/v1/news', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador', 'usuario'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Crear nueva noticia',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['titulo', 'descripcion'],
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 10000 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          original_url: { type: 'string', format: 'uri', nullable: true },
          is_oficial: { type: 'boolean', default: true },
        },
      },
    },
  }, ctrl.createNews);

  // PUT /api/v1/news/:id
  fastify.put('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Actualizar noticia',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } },
      },
      body: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 10000 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          original_url: { type: 'string', format: 'uri', nullable: true },
          is_oficial: { type: 'boolean' },
        },
      },
    },
  }, ctrl.updateNews);

  // DELETE /api/v1/news/:id
  fastify.delete('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Eliminar noticia',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } },
      },
    },
  }, ctrl.deleteNews);

  // POST /api/v1/news/import
  fastify.post('/api/v1/news/import', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Importar noticia desde RSS (usa el script import-latest-news)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          index: { type: 'integer', minimum: 0, description: 'Índice de la noticia en el feed (por defecto 0)'}
        }
      }
    }
  }, ctrl.importNews);

  // GET /api/v1/news/import/stream
  fastify.get('/api/v1/news/import/stream', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Importar noticia (stream de logs en tiempo real)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          index: { type: 'integer', minimum: 0, description: 'Índice de la noticia en el feed (por defecto 0)'}
        }
      }
    }
  }, ctrl.importNewsStream);

  // POST /api/v1/news/:id/like
  fastify.post('/api/v1/news/:id/like', {
    onRequest: [authenticate],
    schema: {
      tags: ['Noticias'],
      summary: 'Dar like a una noticia',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
    },
  }, ctrl.likeNews);

  // DELETE /api/v1/news/:id/like
  fastify.delete('/api/v1/news/:id/like', {
    onRequest: [authenticate],
    schema: {
      tags: ['Noticias'],
      summary: 'Quitar like de una noticia',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
    },
  }, ctrl.unlikeNews);

  // POST /api/v1/news/:id/comments
  fastify.post('/api/v1/news/:id/comments', {
    onRequest: [authenticate],
    schema: {
      tags: ['Noticias'],
      summary: 'Crear comentario',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      body: {
        type: 'object',
        required: ['content'],
        properties: { content: { type: 'string', minLength: 1, maxLength: 1000 } },
      },
      response: {
        201: {
          description: 'Comentario creado correctamente',
          type: 'object',
          properties: {
            id: { type: 'integer' },
            comments_count: { type: 'integer', description: 'Contador actualizado de comentarios' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, ctrl.createComment);

  // GET /api/v1/news/:id/comments
  fastify.get('/api/v1/news/:id/comments', {
    schema: {
      tags: ['Noticias'],
      summary: 'Obtener comentarios',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
    },
  }, ctrl.listComments);
}

module.exports = newsRoutes;


