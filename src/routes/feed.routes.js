const { getFeed, getFeedItem, getFeedStats, syncFeed } = require('../controllers/feedController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * Esquemas de validación para las rutas del feed
 */
const schemas = {
  // Esquema para los parámetros de consulta del feed
  feedQuerySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1, description: 'Número de página' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Cantidad de elementos por página' },
      type: { type: 'integer', enum: [1, 2], description: 'Tipo de contenido: 1=noticias, 2=comunidad' },
      sort: { 
        type: 'string', 
        enum: ['titulo', 'published_at', 'created_at', 'likes_count', 'comments_count'], 
        default: 'published_at', 
        description: 'Campo de ordenación' 
      },
      order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Dirección de ordenación' }
    }
  },

  // Esquema para la respuesta de un elemento del feed
  feedItemSchema: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      resumen: { type: 'string', nullable: true },
      image_url: { type: 'string', nullable: true },
      type: { type: 'integer', enum: [1, 2] },
      original_id: { type: 'integer' },
      user_id: { type: 'integer', nullable: true },
      user_name: { type: 'string', nullable: true },
      published_at: { type: 'string', format: 'date-time', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      original_url: { type: 'string', nullable: true },
      is_oficial: { type: 'boolean', nullable: true },
      video_url: { type: 'string', nullable: true },
      likes_count: { type: 'integer' },
      comments_count: { type: 'integer' },
      is_liked: { type: 'boolean', description: 'Si el usuario actual dio like a este item' }
    }
  },

  // Esquema para la respuesta de lista del feed
  feedListSchema: {
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
            type: { type: 'integer', enum: [1, 2] },
            original_id: { type: 'integer' },
            user_id: { type: 'integer', nullable: true },
            user_name: { type: 'string', nullable: true },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            original_url: { type: 'string', nullable: true },
            is_oficial: { type: 'boolean', nullable: true },
            video_url: { type: 'string', nullable: true },
            likes_count: { type: 'integer' },
            comments_count: { type: 'integer' },
            is_liked: { type: 'boolean', description: 'Si el usuario actual dio like a este item' }
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
};

/**
 * Plugin de Fastify para las rutas del feed
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function feedRoutes(fastify, options) {
  
  // Ruta principal del feed - Pestaña "Todo" (todos los tipos de contenido)
  fastify.get('/api/v1/feed', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener todo el contenido del feed (noticias y comunidad)',
      description: 'Endpoint público para obtener todos los tipos de contenido con paginación y filtros. Pestaña "Todo".',
      querystring: schemas.feedQuerySchema,
      response: {
        200: {
          description: 'Contenido del feed obtenido exitosamente',
          ...schemas.feedListSchema
        }
      }
    }
  }, getFeed);

  // Ruta para la pestaña "Noticias" (type = 1)
  fastify.get('/api/v1/feed/noticias', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener solo noticias del feed',
      description: 'Endpoint público para obtener solo las noticias con paginación y filtros. Pestaña "Noticias".',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Número de página' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Cantidad de elementos por página' },
          sort: { 
            type: 'string', 
            enum: ['titulo', 'published_at', 'created_at', 'likes_count', 'comments_count'], 
            default: 'published_at', 
            description: 'Campo de ordenación' 
          },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Dirección de ordenación' }
        }
      },
      response: {
        200: {
          description: 'Noticias del feed obtenidas exitosamente',
          ...schemas.feedListSchema
        }
      }
    }
  }, async (request, reply) => {
    // Forzar type = 1 para noticias
    request.query.type = 1;
    return getFeed(request, reply);
  });

  // Ruta para la pestaña "Comunidad" (type = 2)
  fastify.get('/api/v1/feed/comunidad', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener solo contenido de comunidad del feed',
      description: 'Endpoint público para obtener solo el contenido de comunidad con paginación y filtros. Pestaña "Comunidad".',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Número de página' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Cantidad de elementos por página' },
          sort: { 
            type: 'string', 
            enum: ['titulo', 'published_at', 'created_at', 'likes_count', 'comments_count'], 
            default: 'published_at', 
            description: 'Campo de ordenación' 
          },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Dirección de ordenación' }
        }
      },
      response: {
        200: {
          description: 'Contenido de comunidad del feed obtenido exitosamente',
          ...schemas.feedListSchema
        }
      }
    }
  }, async (request, reply) => {
    // Forzar type = 2 para comunidad
    request.query.type = 2;
    return getFeed(request, reply);
  });

  // Obtener un elemento específico del feed por ID
  fastify.get('/api/v1/feed/:type/:id', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener elemento específico del feed',
      description: 'Endpoint público para obtener un elemento específico del feed por tipo e ID.',
      params: {
        type: 'object',
        properties: {
          type: { type: 'integer', enum: [1, 2], description: 'Tipo de contenido: 1=noticia, 2=comunidad' },
          id: { type: 'integer', minimum: 1, description: 'ID del elemento en el feed' }
        },
        required: ['type', 'id']
      },
      response: {
        200: {
          description: 'Elemento del feed encontrado',
          ...schemas.feedItemSchema
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, getFeedItem);

  // Obtener un elemento específico del feed por ID solamente
  fastify.get('/api/v1/feed/:id', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener elemento específico del feed por ID',
      description: 'Endpoint público para obtener un elemento específico del feed solo por ID.',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del elemento en el feed' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Elemento del feed encontrado',
          ...schemas.feedItemSchema
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    const { id } = request.params;
    const userId = request.user ? request.user.id : null;

    try {
      let query;
      const queryParams = [];
      
      if (userId) {
        // Si hay usuario autenticado, verificar likes
        query = `
          SELECT 
            cf.id,
            cf.titulo,
            cf.descripcion,
            cf.resumen,
            cf.image_url,
            cf.type,
            cf.original_id,
            cf.user_id,
            cf.user_name,
            cf.published_at,
            cf.created_at,
            cf.updated_at,
            cf.original_url,
            cf.is_oficial,
            cf.video_url,
            cf.likes_count,
            cf.comments_count,
            CASE 
              WHEN cf.type = 1 AND EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND news_id = cf.original_id) THEN 1
              WHEN cf.type = 2 AND EXISTS(SELECT 1 FROM com_likes WHERE user_id = ? AND com_id = cf.original_id) THEN 1
              ELSE 0 
            END as is_liked
          FROM content_feed cf
          WHERE cf.id = ?
        `;
        queryParams.push(userId, userId, parseInt(id));
      } else {
        // Si no hay usuario, is_liked siempre es false
        query = `
          SELECT 
            cf.id,
            cf.titulo,
            cf.descripcion,
            cf.resumen,
            cf.image_url,
            cf.type,
            cf.original_id,
            cf.user_id,
            cf.user_name,
            cf.published_at,
            cf.created_at,
            cf.updated_at,
            cf.original_url,
            cf.is_oficial,
            cf.video_url,
            cf.likes_count,
            cf.comments_count,
            0 as is_liked
          FROM content_feed cf
          WHERE cf.id = ?
        `;
        queryParams.push(parseInt(id));
      }

      const [rows] = await pool.execute(query, queryParams);

      if (rows.length === 0) {
        return reply.status(404).send({
          error: 'Contenido no encontrado'
        });
      }

      const formattedItem = {
        ...rows[0],
        is_liked: Boolean(rows[0].is_liked)
      };

      reply.send(formattedItem);

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  });

  // Estado de likes por lista de feedIds
  fastify.get('/api/v1/feed/likes/status', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Obtener estado de likes por feedIds',
      description: 'Devuelve un mapa id → liked para los IDs provistos. Para type=3 siempre false.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          ids: { type: 'string', description: 'Lista de IDs separados por coma, por ejemplo: 1,2,3' }
        },
        required: ['ids']
      },
      response: {
        200: {
          description: 'Mapa de estados de like por feedId',
          type: 'object',
          properties: {
            statuses: {
              type: 'object',
              additionalProperties: { type: 'boolean' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    const userId = request.user.id;
    const idsParam = (request.query.ids || '').toString();

    // Parseo de IDs
    const feedIds = idsParam
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (feedIds.length === 0) {
      return reply.send({ statuses: {} });
    }

    try {
      // Obtener tipo y original_id por cada feedId
      const placeholders = feedIds.map(() => '?').join(',');
      const [feedRows] = await pool.query(
        `SELECT id, type, original_id FROM content_feed WHERE id IN (${placeholders})`,
        feedIds
      );

      // Inicializar en false por defecto
      const statuses = {};
      for (const id of feedIds) {
        statuses[id] = false;
      }

      if (feedRows.length === 0) {
        return reply.send({ statuses });
      }

      // Separar por tipo y mapear original → feedId
      const type1Map = new Map(); // news_id → feedId
      const type2Map = new Map(); // com_id → feedId
      for (const row of feedRows) {
        if (row.type === 1) type1Map.set(row.original_id, row.id);
        else if (row.type === 2) type2Map.set(row.original_id, row.id);
        // type 3 queda en false
      }

      // Consultar likes para type=1 (noticias)
      const type1Ids = Array.from(type1Map.keys());
      if (type1Ids.length > 0) {
        const ph = type1Ids.map(() => '?').join(',');
        const [likedNews] = await pool.query(
          `SELECT news_id FROM likes WHERE user_id = ? AND news_id IN (${ph})`,
          [userId, ...type1Ids]
        );
        for (const r of likedNews) {
          const feedId = type1Map.get(r.news_id);
          if (feedId) statuses[feedId] = true;
        }
      }

      // Asegurar tabla com_likes y consultar para type=2 (comunidad)
      const type2Ids = Array.from(type2Map.keys());
      if (type2Ids.length > 0) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS com_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            com_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_com (user_id, com_id),
            INDEX idx_user_id (user_id),
            INDEX idx_com_id (com_id)
          )
        `);

        const ph = type2Ids.map(() => '?').join(',');
        const [likedCom] = await pool.query(
          `SELECT com_id FROM com_likes WHERE user_id = ? AND com_id IN (${ph})`,
          [userId, ...type2Ids]
        );
        for (const r of likedCom) {
          const feedId = type2Map.get(r.com_id);
          if (feedId) statuses[feedId] = true;
        }
      }

      return reply.send({ statuses });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener el estado de likes' });
    }
  });

  // IDs del feed que el usuario actual ha likeado
  fastify.get('/api/v1/feed/likes/my', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Obtener IDs del feed likeados por el usuario actual',
      description: 'Devuelve una lista de content_feed.id que el usuario actual tiene con like. Para type=3 no devuelve IDs.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Lista de IDs likeados',
          type: 'object',
          properties: {
            likedIds: {
              type: 'array',
              items: { type: 'integer' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    const userId = request.user.id;
    try {
      // Asegurar existencia de com_likes para evitar errores en SELECT
      await pool.query(`
        CREATE TABLE IF NOT EXISTS com_likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          com_id INT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_com (user_id, com_id),
          INDEX idx_user_id (user_id),
          INDEX idx_com_id (com_id)
        )
      `);

      const [rows] = await pool.query(
        `SELECT cf.id
         FROM content_feed cf
         WHERE (
           cf.type = 1 AND EXISTS (
             SELECT 1 FROM likes l WHERE l.user_id = ? AND l.news_id = cf.original_id
           )
         ) OR (
           cf.type = 2 AND EXISTS (
             SELECT 1 FROM com_likes cl WHERE cl.user_id = ? AND cl.com_id = cf.original_id
           )
         )`,
        [userId, userId]
      );

      const likedIds = rows.map((r) => r.id);
      return reply.send({ likedIds });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener los IDs likeados' });
    }
  });

  // Obtener estadísticas del feed
  fastify.get('/api/v1/feed/stats', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener estadísticas del feed',
      description: 'Endpoint público para obtener estadísticas generales del feed.',
      response: {
        200: {
          description: 'Estadísticas del feed',
          type: 'object',
          properties: {
            total: { type: 'integer' },
            by_type: {
              type: 'object',
              properties: {
                news: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer' },
                    likes: { type: 'integer' },
                    comments: { type: 'integer' }
                  }
                },
                community: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer' },
                    likes: { type: 'integer' },
                    comments: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, getFeedStats);

  // NUEVAS RUTAS PARA LIKES Y COMENTARIOS

  // Dar like a un elemento del feed
  fastify.post('/api/v1/feed/:feedId/like', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Dar like a un elemento del feed',
      description: 'Añadir un like a un elemento específico del feed (funciona para noticias y comunidad)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['feedId'],
        properties: {
          feedId: { type: 'integer', description: 'ID del elemento en la tabla content_feed' }
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
          description: 'Ya se ha dado like a este elemento',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    
    try {
      const { feedId } = request.params;
      const userId = request.user.id;

      // Obtener información del elemento del feed
      const [feedItems] = await pool.query(
        'SELECT type, original_id FROM content_feed WHERE id = ?',
        [feedId]
      );

      if (feedItems.length === 0) {
        return reply.status(404).send({ error: 'Elemento del feed no encontrado' });
      }

      const { type, original_id } = feedItems[0];

      if (type === 1) {
        // Es una noticia - usar la tabla likes existente
        const [existingLike] = await pool.query(
          'SELECT id FROM likes WHERE user_id = ? AND news_id = ?',
          [userId, original_id]
        );

        if (existingLike.length > 0) {
          return reply.status(400).send({ error: 'Ya has dado like a esta noticia' });
        }

        await pool.query(
          'INSERT INTO likes (user_id, news_id) VALUES (?, ?)',
          [userId, original_id]
        );

      return reply.status(201).send({ message: 'Like agregado correctamente' });

      } else if (type === 2) {
        // Es contenido de comunidad - crear tabla com_likes si no existe
        await pool.query(`
          CREATE TABLE IF NOT EXISTS com_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            com_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_com (user_id, com_id),
            INDEX idx_user_id (user_id),
            INDEX idx_com_id (com_id)
          )
        `);

        const [existingLike] = await pool.query(
          'SELECT id FROM com_likes WHERE user_id = ? AND com_id = ?',
          [userId, original_id]
        );

        if (existingLike.length > 0) {
          return reply.status(400).send({ error: 'Ya has dado like a este contenido' });
        }

        await pool.query(
          'INSERT INTO com_likes (user_id, com_id) VALUES (?, ?)',
          [userId, original_id]
        );

        reply.status(201).send({ message: 'Like agregado correctamente' });

      } else {
        return reply.status(400).send({ error: 'Tipo de contenido no válido' });
      }

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al dar like al elemento' });
    }
  });

  // Quitar like de un elemento del feed
  fastify.delete('/api/v1/feed/:feedId/like', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Quitar like de un elemento del feed',
      description: 'Remover el like de un elemento específico del feed',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['feedId'],
        properties: {
          feedId: { type: 'integer', description: 'ID del elemento en la tabla content_feed' }
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
    const pool = require('../config/database');
    
    try {
      const { feedId } = request.params;
      const userId = request.user.id;

      // Obtener información del elemento del feed
      const [feedItems] = await pool.query(
        'SELECT type, original_id FROM content_feed WHERE id = ?',
        [feedId]
      );

      if (feedItems.length === 0) {
        return reply.status(404).send({ error: 'Elemento del feed no encontrado' });
      }

      const { type, original_id } = feedItems[0];

      let result;
      if (type === 1) {
        // Es una noticia
        [result] = await pool.query(
          'DELETE FROM likes WHERE user_id = ? AND news_id = ?',
          [userId, original_id]
        );
      } else if (type === 2) {
        // Es contenido de comunidad
        [result] = await pool.query(
          'DELETE FROM com_likes WHERE user_id = ? AND com_id = ?',
          [userId, original_id]
        );
      }

      if (result.affectedRows === 0) {
        return reply.status(404).send({ error: 'No se encontró el like' });
      }

      return reply.status(200).send({ message: 'Like eliminado correctamente' });

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al eliminar el like' });
    }
  });

  // Crear comentario en un elemento del feed
  fastify.post('/api/v1/feed/:feedId/comments', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Crear comentario en un elemento del feed',
      description: 'Añadir un comentario a un elemento específico del feed',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['feedId'],
        properties: {
          feedId: { type: 'integer', description: 'ID del elemento en la tabla content_feed' }
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
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    
    try {
      const { feedId } = request.params;
      const { content } = request.body;
      const userId = request.user.id;

      // Obtener información del elemento del feed
      const [feedItems] = await pool.query(
        'SELECT type, original_id FROM content_feed WHERE id = ?',
        [feedId]
      );

      if (feedItems.length === 0) {
        return reply.status(404).send({ error: 'Elemento del feed no encontrado' });
      }

      const { type, original_id } = feedItems[0];

      let result;
      if (type === 1) {
        // Es una noticia - usar la tabla comments existente
        [result] = await pool.query(
          'INSERT INTO comments (user_id, news_id, content) VALUES (?, ?, ?)',
          [userId, original_id, content]
        );
      } else if (type === 2) {
        // Es contenido de comunidad - crear tabla com_comments si no existe
        await pool.query(`
          CREATE TABLE IF NOT EXISTS com_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            com_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_com_id (com_id)
          )
        `);

        [result] = await pool.query(
          'INSERT INTO com_comments (user_id, com_id, content) VALUES (?, ?, ?)',
          [userId, original_id, content]
        );
      }

      return reply.status(201).send({
        id: result.insertId,
        message: 'Comentario creado correctamente'
      });

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al crear el comentario' });
    }
  });

  // Obtener comentarios de un elemento del feed
  fastify.get('/api/v1/feed/:feedId/comments', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener comentarios de un elemento del feed',
      description: 'Obtener todos los comentarios de un elemento específico del feed',
      params: {
        type: 'object',
        required: ['feedId'],
        properties: {
          feedId: { type: 'integer', description: 'ID del elemento en la tabla content_feed' }
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
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    
    try {
      const { feedId } = request.params;

      // Obtener información del elemento del feed
      const [feedItems] = await pool.query(
        'SELECT type, original_id FROM content_feed WHERE id = ?',
        [feedId]
      );

      if (feedItems.length === 0) {
        return reply.status(404).send({ error: 'Elemento del feed no encontrado' });
      }

      const { type, original_id } = feedItems[0];

      let comments;
      if (type === 1) {
        // Es una noticia
        [comments] = await pool.query(`
          SELECT c.*, u.nombre as autor 
          FROM comments c 
          JOIN users u ON c.user_id = u.id 
          WHERE c.news_id = ? 
          ORDER BY c.created_at DESC
        `, [original_id]);
      } else if (type === 2) {
        // Es contenido de comunidad - crear tabla si no existe
        await pool.query(`
          CREATE TABLE IF NOT EXISTS com_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            com_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_com_id (com_id)
          )
        `);
        
        [comments] = await pool.query(`
          SELECT c.*, u.nombre as autor 
          FROM com_comments c 
          JOIN users u ON c.user_id = u.id 
          WHERE c.com_id = ? 
          ORDER BY c.created_at DESC
        `, [original_id]);
      }

      return reply.send(comments || []);

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al obtener los comentarios' });
    }
  });

  // Toggle like en un elemento del feed (añadir o quitar like)
  fastify.post('/api/v1/feed/:feedId/like/toggle', {
    onRequest: [authenticate],
    schema: {
      tags: ['Feed'],
      summary: 'Toggle like en un elemento del feed',
      description: 'Añadir o quitar like de un elemento específico del feed (funciona para noticias y comunidad)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['feedId'],
        properties: {
          feedId: { type: 'integer', description: 'ID del elemento en la tabla content_feed' }
        }
      },
      response: {
        200: {
          description: 'Like toggled correctamente',
          type: 'object',
          properties: {
            liked: { type: 'boolean', description: 'Estado actual del like' },
            likes_count: { type: 'integer', description: 'Número total de likes' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    
    try {
      const { feedId } = request.params;
      const userId = request.user.id;

      // Obtener información del elemento del feed
      const [feedItems] = await pool.query(
        'SELECT type, original_id FROM content_feed WHERE id = ?',
        [feedId]
      );

      if (feedItems.length === 0) {
        return reply.status(404).send({ error: 'Elemento del feed no encontrado' });
      }

      const { type, original_id } = feedItems[0];
      let isCurrentlyLiked = false;
      let newLikesCount = 0;

      if (type === 1) {
        // Es una noticia - usar la tabla likes existente
        const [existingLike] = await pool.query(
          'SELECT id FROM likes WHERE user_id = ? AND news_id = ?',
          [userId, original_id]
        );

        if (existingLike.length > 0) {
          // Quitar like
          await pool.query(
            'DELETE FROM likes WHERE user_id = ? AND news_id = ?',
            [userId, original_id]
          );
          isCurrentlyLiked = false;
        } else {
          // Añadir like
          await pool.query(
            'INSERT INTO likes (user_id, news_id) VALUES (?, ?)',
            [userId, original_id]
          );
          isCurrentlyLiked = true;
        }

        // Contar likes totales y actualizar content_feed
        const [likesCount] = await pool.query(
          'SELECT COUNT(*) as count FROM likes WHERE news_id = ?',
          [original_id]
        );
        newLikesCount = likesCount[0].count;

        await pool.query(
          'UPDATE content_feed SET likes_count = ? WHERE id = ?',
          [newLikesCount, feedId]
        );

      } else if (type === 2) {
        // Es contenido de comunidad - crear tabla com_likes si no existe
        await pool.query(`
          CREATE TABLE IF NOT EXISTS com_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            com_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_com (user_id, com_id),
            INDEX idx_user_id (user_id),
            INDEX idx_com_id (com_id)
          )
        `);

        const [existingLike] = await pool.query(
          'SELECT id FROM com_likes WHERE user_id = ? AND com_id = ?',
          [userId, original_id]
        );

        if (existingLike.length > 0) {
          // Quitar like
          await pool.query(
            'DELETE FROM com_likes WHERE user_id = ? AND com_id = ?',
            [userId, original_id]
          );
          isCurrentlyLiked = false;
        } else {
          // Añadir like
          await pool.query(
            'INSERT INTO com_likes (user_id, com_id) VALUES (?, ?)',
            [userId, original_id]
          );
          isCurrentlyLiked = true;
        }

        // Contar likes totales y actualizar content_feed
        const [likesCount] = await pool.query(
          'SELECT COUNT(*) as count FROM com_likes WHERE com_id = ?',
          [original_id]
        );
        newLikesCount = likesCount[0].count;

        await pool.query(
          'UPDATE content_feed SET likes_count = ? WHERE id = ?',
          [newLikesCount, feedId]
        );

      } else {
        return reply.status(400).send({ error: 'Tipo de contenido no válido' });
      }

      const message = isCurrentlyLiked ? 'Like agregado correctamente' : 'Like eliminado correctamente';

      return reply.status(200).send({
        liked: isCurrentlyLiked,
        likes_count: newLikesCount,
        message
      });

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Error al cambiar el like del elemento' });
    }
  });

  // Sincronización manual del feed (solo administradores)
  fastify.post('/api/v1/feed/sync', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Feed'],
      summary: 'Sincronizar feed manualmente',
      description: 'Forzar sincronización manual del feed. Solo administradores.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Sincronización completada',
          type: 'object',
          properties: {
            message: { type: 'string' },
            processed: { type: 'integer' }
          }
        }
      }
    }
  }, syncFeed);

  // Obtener un elemento del feed por tipo y ID original (para compatibilidad con frontend)
  fastify.get('/api/v1/feed/by-original-id/:type/:originalId', {
    schema: {
      tags: ['Feed'],
      summary: 'Obtener elemento del feed por tipo e ID original',
      description: 'Endpoint para obtener un elemento del feed usando el ID original (news_id o com_id).',
      params: {
        type: 'object',
        properties: {
          type: { type: 'integer', enum: [1, 2], description: 'Tipo de contenido: 1=noticia, 2=comunidad' },
          originalId: { type: 'integer', minimum: 1, description: 'ID original del contenido' }
        },
        required: ['type', 'originalId']
      },
      response: {
        200: {
          description: 'Elemento del feed encontrado',
          ...schemas.feedItemSchema
        },
        404: {
          description: 'Elemento no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pool = require('../config/database');
    const { type, originalId } = request.params;
    const userId = request.user ? request.user.id : null;

    try {
      let query;
      const queryParams = [];
      
      if (userId) {
        // Si hay usuario autenticado, verificar likes
        query = `
          SELECT 
            cf.id,
            cf.titulo,
            cf.descripcion,
            cf.resumen,
            cf.image_url,
            cf.type,
            cf.original_id,
            cf.user_id,
            cf.user_name,
            cf.published_at,
            cf.created_at,
            cf.updated_at,
            cf.original_url,
            cf.is_oficial,
            cf.video_url,
            cf.likes_count,
            cf.comments_count,
            CASE 
              WHEN cf.type = 1 AND EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND news_id = cf.original_id) THEN 1
              WHEN cf.type = 2 AND EXISTS(SELECT 1 FROM com_likes WHERE user_id = ? AND com_id = cf.original_id) THEN 1
              ELSE 0 
            END as is_liked
          FROM content_feed cf
          WHERE cf.type = ? AND cf.original_id = ?
        `;
        queryParams.push(userId, userId, parseInt(type), parseInt(originalId));
      } else {
        // Si no hay usuario, is_liked siempre es false
        query = `
          SELECT 
            cf.id,
            cf.titulo,
            cf.descripcion,
            cf.resumen,
            cf.image_url,
            cf.type,
            cf.original_id,
            cf.user_id,
            cf.user_name,
            cf.published_at,
            cf.created_at,
            cf.updated_at,
            cf.original_url,
            cf.is_oficial,
            cf.video_url,
            cf.likes_count,
            cf.comments_count,
            0 as is_liked
          FROM content_feed cf
          WHERE cf.type = ? AND cf.original_id = ?
        `;
        queryParams.push(parseInt(type), parseInt(originalId));
      }

      const [rows] = await pool.execute(query, queryParams);

      if (rows.length === 0) {
        return reply.status(404).send({
          error: 'Contenido no encontrado'
        });
      }

      const formattedItem = {
        ...rows[0],
        is_liked: Boolean(rows[0].is_liked)
      };

      reply.send(formattedItem);

    } catch (error) {
      request.log.error(error);
      reply.status(500).send({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  });
}

module.exports = feedRoutes; 