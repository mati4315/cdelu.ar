const { getNews, getNewsById, createNews, updateNews, deleteNews } = require('../controllers/newsController');
const { authenticate, authorize } = require('../middlewares/auth');
const pool = require('../config/database');

/**
 * Configura las rutas de noticias
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function newsRoutes(fastify, options) {
  // Obtener todas las noticias (público)
  fastify.get('/api/v1/news', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, getNews);

  // Obtener una noticia por ID (público)
  fastify.get('/api/v1/news/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      }
    }
  }, getNewsById);

  // Crear una nueva noticia (requiere autenticación y rol de administrador o colaborador)
  fastify.post('/api/v1/news', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      body: {
        type: 'object',
        required: ['titulo', 'descripcion'],
        properties: {
          titulo: { type: 'string', minLength: 1 },
          descripcion: { type: 'string', minLength: 1 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          original_url: { type: 'string', format: 'uri', nullable: true },
          is_oficial: { type: 'boolean', default: true }
        }
      }
    }
  }, createNews);

  // Actualizar una noticia (requiere autenticación y rol de administrador o colaborador)
  fastify.put('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1 },
          descripcion: { type: 'string', minLength: 1 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          original_url: { type: 'string', format: 'uri', nullable: true },
          is_oficial: { type: 'boolean' }
        }
      }
    }
  }, updateNews);

  // Eliminar una noticia (requiere autenticación y rol de administrador)
  fastify.delete('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      }
    }
  }, deleteNews);

  // Endpoint para dar like a una noticia
  fastify.post('/api/v1/news/:id/like', {
    onRequest: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Verificar si ya existe un like
      const [existingLike] = await pool.query(
        'SELECT id FROM likes WHERE user_id = ? AND news_id = ?',
        [userId, id]
      );

      if (existingLike.length > 0) {
        return reply.status(400).send({ error: 'Ya has dado like a esta noticia' });
      }

      // Crear nuevo like
      await pool.query(
        'INSERT INTO likes (user_id, news_id) VALUES (?, ?)',
        [userId, id]
      );

      reply.status(201).send({ message: 'Like agregado correctamente' });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al dar like a la noticia' });
    }
  });

  // Endpoint para quitar like
  fastify.delete('/api/v1/news/:id/like', {
    onRequest: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const [result] = await pool.query(
        'DELETE FROM likes WHERE user_id = ? AND news_id = ?',
        [userId, id]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({ error: 'No se encontró el like' });
      }

      reply.status(200).send({ message: 'Like eliminado correctamente' });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al eliminar el like' });
    }
  });

  // Endpoint para crear comentario
  fastify.post('/api/v1/news/:id/comments', {
    onRequest: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { content } = request.body;
      const userId = request.user.id;

      const [result] = await pool.query(
        'INSERT INTO comments (user_id, news_id, content) VALUES (?, ?, ?)',
        [userId, id, content]
      );

      reply.status(201).send({
        id: result.insertId,
        message: 'Comentario creado correctamente'
      });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al crear el comentario' });
    }
  });

  // Endpoint para obtener comentarios de una noticia
  fastify.get('/api/v1/news/:id/comments', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const [comments] = await pool.query(`
        SELECT c.*, u.nombre as autor 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.news_id = ? 
        ORDER BY c.created_at DESC
      `, [id]);

      reply.send(comments);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener los comentarios' });
    }
  });
}

module.exports = newsRoutes; 