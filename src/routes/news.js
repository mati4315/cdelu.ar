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
      tags: ['Noticias'],
      summary: 'Obtener todas las noticias',
      description: 'Endpoint público para obtener la lista de noticias con paginación, ordenación y filtros',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Número de página' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Cantidad de noticias por página' },
          sort: { type: 'string', enum: ['titulo', 'created_at', 'likes_count', 'comments_count'], default: 'created_at', description: 'Campo de ordenación' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Dirección de ordenación' }
        }
      },
      response: {
        200: {
          description: 'Lista de noticias obtenida exitosamente',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  titulo: { type: 'string' },
                  descripcion: { type: 'string' },
                  resumen: { type: 'string', nullable: true },
                  image_url: { type: 'string', nullable: true },
                  original_url: { type: 'string', nullable: true },
                  published_at: { type: 'string', format: 'date-time', nullable: true },
                  is_oficial: { type: 'boolean' },
                  created_by: { type: 'integer', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  autor: { type: 'string', nullable: true },
                  likes_count: { type: 'integer' },
                  comments_count: { type: 'integer' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, getNews);

  // Obtener una noticia por ID (público)
  fastify.get('/api/v1/news/:id', {
    schema: {
      tags: ['Noticias'],
      summary: 'Obtener noticia por ID',
      description: 'Endpoint público para obtener los detalles de una noticia específica',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID único de la noticia' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Noticia encontrada',
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            resumen: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            original_url: { type: 'string', nullable: true },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            is_oficial: { type: 'boolean' },
            created_by: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            autor: { type: 'string', nullable: true }
          }
        },
        404: {
          description: 'Noticia no encontrada',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, getNewsById);

  // Crear una nueva noticia (requiere autenticación y rol de administrador, colaborador o usuario)
  fastify.post('/api/v1/news', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador', 'usuario'])], // Permitir usuarios
    schema: {
      tags: ['Noticias'],
      summary: 'Crear nueva noticia',
      description: 'Crear una nueva noticia. Requiere autenticación. Los usuarios con rol "usuario" pueden crear noticias.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['titulo', 'descripcion'],
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 200, description: 'Título de la noticia' },
          descripcion: { type: 'string', minLength: 1, maxLength: 10000, description: 'Contenido completo de la noticia' },
          image_url: { type: 'string', format: 'uri', nullable: true, description: 'URL de la imagen principal' },
          original_url: { type: 'string', format: 'uri', nullable: true, description: 'URL de la fuente original' },
          is_oficial: { type: 'boolean', default: true, description: 'Indica si es una noticia oficial (genera contenido con IA)' }
        }
      },
      response: {
        201: {
          description: 'Noticia creada exitosamente',
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            resumen: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            original_url: { type: 'string', nullable: true },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            is_oficial: { type: 'boolean' },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            autor: { type: 'string' }
          }
        },
        400: {
          description: 'Datos de entrada inválidos',
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' }
          }
        },
        401: {
          description: 'No autorizado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Sin permisos',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, createNews);

  // Actualizar una noticia (requiere autenticación y rol de administrador o colaborador)
  fastify.put('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador', 'colaborador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Actualizar noticia',
      description: 'Actualizar una noticia existente. Solo administradores y colaboradores.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID de la noticia a actualizar' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 10000 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          original_url: { type: 'string', format: 'uri', nullable: true },
          is_oficial: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Noticia actualizada exitosamente',
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            resumen: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            original_url: { type: 'string', nullable: true },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            is_oficial: { type: 'boolean' },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            autor: { type: 'string' }
          }
        },
        404: {
          description: 'Noticia no encontrada',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, updateNews);

  // Eliminar una noticia (requiere autenticación y rol de administrador)
  fastify.delete('/api/v1/news/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Noticias'],
      summary: 'Eliminar noticia',
      description: 'Eliminar una noticia. Solo administradores.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID de la noticia a eliminar' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Noticia eliminada exitosamente',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Noticia no encontrada',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, deleteNews);

  // Endpoint para dar like a una noticia
  fastify.post('/api/v1/news/:id/like', {
    onRequest: [authenticate],
    schema: {
      tags: ['Noticias'],
      summary: 'Dar like a una noticia',
      description: 'Añadir un like a una noticia específica',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID de la noticia' }
        }
      },
      response: {
        201: {
          description: 'Like añadido correctamente',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Ya se ha dado like a esta noticia',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
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
      tags: ['Noticias'],
      summary: 'Quitar like de una noticia',
      description: 'Remover el like de una noticia específica',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID de la noticia' }
        }
      },
      response: {
        200: {
          description: 'Like eliminado correctamente',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Like no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
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
      tags: ['Noticias'],
      summary: 'Crear comentario en una noticia',
      description: 'Añadir un comentario a una noticia específica',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID de la noticia' }
        }
      },
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 1000, description: 'Contenido del comentario' }
        }
      },
      response: {
        201: {
          description: 'Comentario creado correctamente',
          type: 'object',
          properties: {
            id: { type: 'integer' },
            message: { type: 'string' }
          }
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
      tags: ['Noticias'],
      summary: 'Obtener comentarios de una noticia',
      description: 'Obtener todos los comentarios de una noticia específica',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID de la noticia' }
        }
      },
      response: {
        200: {
          description: 'Lista de comentarios',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              content: { type: 'string' },
              autor: { type: 'string' },
              user_id: { type: 'integer' },
              news_id: { type: 'integer' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
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