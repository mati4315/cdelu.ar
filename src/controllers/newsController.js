const pool = require('../config/database');
const { generateSummary, generateTitle } = require('../services/aiService');

/**
 * Obtiene todas las noticias con paginación
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function getNews(request, reply) {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = request.query;
    const offset = (page - 1) * limit;

    // Validar parámetros de ordenamiento
    const allowedSortFields = ['titulo', 'created_at', 'likes_count', 'comments_count'];
    const allowedOrders = ['asc', 'desc'];
    
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = allowedOrders.includes(order) ? order : 'desc';

    // Construir la consulta SQL con ordenamiento dinámico
    let orderByClause = 'ORDER BY n.created_at DESC';
    
    if (sortField === 'titulo') {
      orderByClause = `ORDER BY n.titulo ${sortOrder.toUpperCase()}`;
    } else if (sortField === 'created_at') {
      orderByClause = `ORDER BY n.created_at ${sortOrder.toUpperCase()}`;
    } else if (sortField === 'likes_count') {
      orderByClause = `ORDER BY likes_count ${sortOrder.toUpperCase()}`;
    } else if (sortField === 'comments_count') {
      orderByClause = `ORDER BY comments_count ${sortOrder.toUpperCase()}`;
    }

    // Obtener noticias con información de likes y comentarios
    const [news] = await pool.query(`
      SELECT 
        n.*,
        u.nombre as autor,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM news n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN likes l ON n.id = l.news_id
      LEFT JOIN comments c ON n.id = c.news_id
      GROUP BY n.id
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Obtener total de noticias para paginación
    const [total] = await pool.query('SELECT COUNT(*) as total FROM news');
    const totalPages = Math.ceil(total[0].total / limit);

    reply.send({
      data: news,
      pagination: {
        total: total[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al obtener las noticias' });
  }
}

/**
 * Obtiene una noticia por su ID
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function getNewsById(request, reply) {
  try {
    const { id } = request.params;
    const [news] = await pool.query(
      `SELECT n.*, u.nombre as autor 
       FROM news n 
       LEFT JOIN users u ON n.created_by = u.id 
       WHERE n.id = ?`,
      [id]
    );

    if (news.length === 0) {
      return reply.status(404).send({ error: 'Noticia no encontrada' });
    }

    reply.send(news[0]);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al obtener la noticia' });
  }
}

/**
 * Crea una nueva noticia
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function createNews(request, reply) {
  try {
    const { titulo, descripcion, image_url, original_url, is_oficial } = request.body;
    const userId = request.user.id;

    // Generar resumen y título con IA si es una noticia oficial
    let resumen = null;
    let tituloFinal = titulo;

    if (is_oficial) {
      try {
        resumen = await generateSummary(descripcion);
        tituloFinal = await generateTitle(descripcion);
      } catch (error) {
        console.error('Error al generar contenido con IA:', error);
        // Continuar sin el contenido generado por IA
      }
    }

    const [result] = await pool.query(
      `INSERT INTO news (
        titulo, 
        descripcion, 
        resumen,
        image_url, 
        original_url, 
        is_oficial,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tituloFinal, descripcion, resumen, image_url, original_url, is_oficial, userId]
    );

    const [news] = await pool.query(
      'SELECT n.*, u.nombre as autor FROM news n LEFT JOIN users u ON n.created_by = u.id WHERE n.id = ?',
      [result.insertId]
    );

    reply.status(201).send(news[0]);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al crear la noticia' });
  }
}

/**
 * Actualiza una noticia existente
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function updateNews(request, reply) {
  try {
    const { id } = request.params;
    const { titulo, descripcion, image_url, original_url, is_oficial } = request.body;
    const userRole = request.user?.role;
    const userId = request.user?.id;

    // Construir la consulta según el rol del usuario
    let query = 'SELECT * FROM news WHERE id = ?';
    const queryParams = [id];
    
    // Si no es admin, solo puede editar sus propias noticias
    if (userRole !== 'administrador') {
        query += ' AND created_by = ?';
        queryParams.push(userId);
    }
    
    // Verificar si la noticia existe y el usuario tiene permisos
    const [existingNews] = await pool.query(query, queryParams);

    if (existingNews.length === 0) {
      return reply.status(404).send({ error: 'Noticia no encontrada' });
    }

    // Generar nuevo resumen si la descripción cambió y es una noticia oficial
    let resumen = existingNews[0].resumen;
    if (is_oficial && descripcion !== existingNews[0].descripcion) {
      try {
        resumen = await generateSummary(descripcion);
      } catch (error) {
        console.error('Error al generar resumen con IA:', error);
        // Mantener el resumen existente
      }
    }

    await pool.query(
      `UPDATE news SET 
        titulo = ?, 
        descripcion = ?, 
        resumen = ?,
        image_url = ?, 
        original_url = ?, 
        is_oficial = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [titulo, descripcion, resumen, image_url, original_url, is_oficial, id]
    );

    const [updatedNews] = await pool.query(
      'SELECT n.*, u.nombre as autor FROM news n LEFT JOIN users u ON n.created_by = u.id WHERE n.id = ?',
      [id]
    );

    reply.send(updatedNews[0]);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al actualizar la noticia' });
  }
}

/**
 * Elimina una noticia
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function deleteNews(request, reply) {
  try {
    const { id } = request.params;
    const userRole = request.user?.role;
    const userId = request.user?.id;

    let query = 'DELETE FROM news WHERE id = ?';
    const queryParams = [id];

    // Si no es admin, solo puede borrar sus propias noticias
    if (userRole !== 'administrador') {
        query += ' AND created_by = ?';
        queryParams.push(userId);
    }

    const [result] = await pool.query(query, queryParams);

    if (result.affectedRows === 0) {
      return reply.status(404).send({ error: 'Noticia no encontrada o no autorizado' });
    }

    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al eliminar la noticia' });
  }
}

module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
}; 