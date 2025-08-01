const pool = require('../config/database');

/**
 * Obtener contenido del feed principal con paginación y filtros
 * @param {Object} request - Solicitud de Fastify
 * @param {Object} reply - Respuesta de Fastify
 */
async function getFeed(request, reply) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      sort = 'published_at', 
      order = 'desc' 
    } = request.query;

    const offset = (page - 1) * limit;
    const userId = request.user ? request.user.id : null; // Usuario actual si está autenticado
    
    // Validar parámetros de ordenación
    const validSortFields = ['titulo', 'published_at', 'created_at', 'likes_count', 'comments_count'];
    const validOrderTypes = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sort) ? sort : 'published_at';
    const orderType = validOrderTypes.includes(order) ? order : 'desc';

    // Construir condición WHERE para filtrar por tipo
    let whereCondition = '';
    let queryParams = [];
    
    if (type) {
      whereCondition = 'WHERE type = ?';
      queryParams.push(parseInt(type));
    }

    // Consulta para obtener el total de registros
    const totalQuery = `
      SELECT COUNT(*) as total 
      FROM content_feed 
      ${whereCondition}
    `;
    
    const [totalResult] = await pool.execute(totalQuery, queryParams);
    const total = totalResult[0].total;

    // Consulta principal para obtener los datos CON información de likes del usuario
    let query;
    const finalParams = [];
    
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
        ${whereCondition}
        ORDER BY ${sortField} ${orderType}
        LIMIT ? OFFSET ?
      `;
      finalParams.push(userId, userId); // Para las subconsultas de likes
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
        ${whereCondition}
        ORDER BY ${sortField} ${orderType}
        LIMIT ? OFFSET ?
      `;
    }

    // Preparar parámetros finales
    finalParams.push(...queryParams); // Parámetros del WHERE
    finalParams.push(parseInt(limit), offset); // Parámetros de paginación

    const [rows] = await pool.execute(query, finalParams);

    // Convertir is_liked de 0/1 a boolean
    const formattedRows = rows.map(row => ({
      ...row,
      is_liked: Boolean(row.is_liked)
    }));

    // Calcular páginas totales
    const totalPages = Math.ceil(total / limit);

    reply.send({
      data: formattedRows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });

  } catch (error) {
    console.error('Error al obtener el feed:', error);
    reply.status(500).send({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

/**
 * Obtener un elemento específico del feed por ID y tipo
 * @param {Object} request - Solicitud de Fastify
 * @param {Object} reply - Respuesta de Fastify
 */
async function getFeedItem(request, reply) {
  try {
    const { id, type } = request.params;
    const userId = request.user ? request.user.id : null; // Usuario actual si está autenticado

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
        WHERE cf.id = ? AND cf.type = ?
      `;
      queryParams.push(userId, userId, parseInt(id), parseInt(type));
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
        WHERE cf.id = ? AND cf.type = ?
      `;
      queryParams.push(parseInt(id), parseInt(type));
    }

    const [rows] = await pool.execute(query, queryParams);

    if (rows.length === 0) {
      return reply.status(404).send({
        error: 'Contenido no encontrado'
      });
    }

    // Convertir is_liked de 0/1 a boolean
    const formattedItem = {
      ...rows[0],
      is_liked: Boolean(rows[0].is_liked)
    };

    reply.send(formattedItem);

  } catch (error) {
    console.error('Error al obtener el elemento del feed:', error);
    reply.status(500).send({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

/**
 * Obtener estadísticas del feed
 * @param {Object} request - Solicitud de Fastify
 * @param {Object} reply - Respuesta de Fastify
 */
async function getFeedStats(request, reply) {
  try {
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM content_feed 
      GROUP BY type
    `;

    const [rows] = await pool.execute(query);

    // Formatear los resultados
    const stats = {
      total: 0,
      by_type: {
        news: { count: 0, likes: 0, comments: 0 },
        community: { count: 0, likes: 0, comments: 0 }
      }
    };

    rows.forEach(row => {
      stats.total += row.count;
      
      if (row.type === 1) {
        stats.by_type.news = {
          count: row.count,
          likes: row.total_likes || 0,
          comments: row.total_comments || 0
        };
      } else if (row.type === 2) {
        stats.by_type.community = {
          count: row.count,
          likes: row.total_likes || 0,
          comments: row.total_comments || 0
        };
      }
    });

    reply.send(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas del feed:', error);
    reply.status(500).send({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

/**
 * Sincronizar la tabla content_feed con los datos actuales
 * Esta función es útil para migración inicial o resincronización
 * @param {Object} request - Solicitud de Fastify
 * @param {Object} reply - Respuesta de Fastify
 */
async function syncFeed(request, reply) {
  try {
    // Limpiar la tabla
    await pool.execute('DELETE FROM content_feed');

    // Insertar datos desde news
    const newsQuery = `
      INSERT INTO content_feed (
        titulo, descripcion, resumen, image_url, type, original_id, 
        user_id, user_name, published_at, created_at, updated_at,
        original_url, is_oficial
      )
      SELECT 
        n.titulo, n.descripcion, n.resumen, n.image_url, 1, n.id,
        n.created_by, u.nombre, n.published_at, n.created_at, n.updated_at,
        n.original_url, n.is_oficial
      FROM news n
      LEFT JOIN users u ON n.created_by = u.id
    `;

    await pool.execute(newsQuery);

    // Insertar datos desde com
    const comQuery = `
      INSERT INTO content_feed (
        titulo, descripcion, image_url, type, original_id,
        user_id, user_name, published_at, created_at, updated_at,
        video_url
      )
      SELECT 
        c.titulo, c.descripcion, c.image_url, 2, c.id,
        c.user_id, u.nombre, c.created_at, c.created_at, c.updated_at,
        c.video_url
      FROM com c
      LEFT JOIN users u ON c.user_id = u.id
    `;

    await pool.execute(comQuery);

    reply.send({
      message: 'Feed sincronizado exitosamente'
    });

  } catch (error) {
    console.error('Error al sincronizar el feed:', error);
    reply.status(500).send({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  getFeed,
  getFeedItem,
  getFeedStats,
  syncFeed
}; 