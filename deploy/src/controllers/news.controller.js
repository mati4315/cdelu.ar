const { query } = require('../../config/database');

/**
 * Controlador para gestionar las noticias
 */
class NewsController {
  /**
   * Crea una nueva noticia
   * @param {Object} req - Solicitud HTTP
   * @param {Object} reply - Respuesta HTTP
   */
  async create(req, reply) {
    const { titulo, descripcion, image_url, original_url, is_oficial } = req.body;

    try {
      const result = await query(
        `INSERT INTO news (titulo, descripcion, image_url, original_url, is_oficial)
         VALUES (?, ?, ?, ?, ?)`,
        [titulo, descripcion, image_url, original_url, is_oficial]
      );

      const [newNews] = await query(
        'SELECT * FROM news WHERE id = ?',
        [result.insertId]
      );

      return reply.code(201).send(newNews);
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'Error al crear la noticia' });
    }
  }

  /**
   * Obtiene una noticia por su ID
   * @param {Object} req - Solicitud HTTP
   * @param {Object} reply - Respuesta HTTP
   */
  async getById(req, reply) {
    const { id } = req.params;

    try {
      const [news] = await query(
        'SELECT * FROM news WHERE id = ?',
        [id]
      );

      if (!news) {
        return reply.code(404).send({ error: 'Noticia no encontrada' });
      }

      return reply.send(news);
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener la noticia' });
    }
  }

  /**
   * Actualiza una noticia existente
   * @param {Object} req - Solicitud HTTP
   * @param {Object} reply - Respuesta HTTP
   */
  async update(req, reply) {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    try {
      const result = await query(
        `UPDATE news 
         SET titulo = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [titulo, descripcion, id]
      );

      if (result.affectedRows === 0) {
        return reply.code(404).send({ error: 'Noticia no encontrada' });
      }

      const [updatedNews] = await query(
        'SELECT * FROM news WHERE id = ?',
        [id]
      );

      return reply.send(updatedNews);
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'Error al actualizar la noticia' });
    }
  }

  /**
   * Elimina una noticia
   * @param {Object} req - Solicitud HTTP
   * @param {Object} reply - Respuesta HTTP
   */
  async delete(req, reply) {
    const { id } = req.params;

    try {
      const result = await query(
        'DELETE FROM news WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return reply.code(404).send({ error: 'Noticia no encontrada' });
      }

      return reply.code(204).send();
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'Error al eliminar la noticia' });
    }
  }
}

module.exports = new NewsController(); 