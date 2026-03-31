const pool = require('../config/database');

/**
 * Controlador para gestión de anuncios publicitarios
 */
class AdsController {
  
  /**
   * Obtener anuncios activos para el feed
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async getActiveAds(request, reply) {
    try {
      const { limit = 20, categoria } = request.query;
      
      let query = `
        SELECT 
          id, titulo, descripcion, image_url, enlace_destino, 
          texto_opcional, categoria, prioridad, activo,
          impresiones_maximas, impresiones_actuales, clics_count,
          created_at, updated_at
        FROM ads 
        WHERE activo = TRUE
      `;
      
      const params = [];
      
      if (categoria) {
        query += ' AND categoria = ?';
        params.push(categoria);
      }
      
      query += ' ORDER BY prioridad DESC, created_at DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const [ads] = await pool.query(query, params);
      
      return {
        success: true,
        data: ads,
        total: ads.length
      };
    } catch (error) {
      request.log.error('Error al obtener anuncios activos:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los anuncios'
      });
    }
  }

  /**
   * Obtener todos los anuncios (para administración)
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async getAllAds(request, reply) {
    try {
      const { page = 1, limit = 10, categoria, activo } = request.query;
      const offset = (page - 1) * limit;
      
      let whereClause = '1=1';
      const params = [];
      
      if (categoria) {
        whereClause += ' AND categoria = ?';
        params.push(categoria);
      }
      
      if (activo !== undefined) {
        whereClause += ' AND activo = ?';
        params.push(activo === 'true');
      }
      
      // Obtener total de registros
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM ads WHERE ${whereClause}`,
        params
      );
      const total = countResult[0].total;
      
      // Obtener anuncios paginados
      const query = `
        SELECT 
          a.id, a.titulo, a.descripcion, a.image_url, a.enlace_destino,
          a.texto_opcional, a.categoria, a.prioridad, a.activo,
          a.impresiones_maximas, a.impresiones_actuales, a.clics_count,
          a.created_at, a.updated_at,
          u.nombre as created_by_name
        FROM ads a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [ads] = await pool.query(query, [...params, parseInt(limit), offset]);
      
      return {
        success: true,
        data: ads,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      request.log.error('Error al obtener todos los anuncios:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los anuncios'
      });
    }
  }

  /**
   * Obtener un anuncio por ID
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async getAdById(request, reply) {
    try {
      const { id } = request.params;
      
      const [ads] = await pool.query(`
        SELECT 
          a.id, a.titulo, a.descripcion, a.image_url, a.enlace_destino,
          a.texto_opcional, a.categoria, a.prioridad, a.activo,
          a.impresiones_maximas, a.impresiones_actuales, a.clics_count,
          a.created_at, a.updated_at,
          u.nombre as created_by_name
        FROM ads a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [id]);
      
      if (ads.length === 0) {
        return reply.code(404).send({
          error: 'Anuncio no encontrado',
          message: 'El anuncio especificado no existe'
        });
      }
      
      return {
        success: true,
        data: ads[0]
      };
    } catch (error) {
      request.log.error('Error al obtener anuncio por ID:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el anuncio'
      });
    }
  }

  /**
   * Crear un nuevo anuncio
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async createAd(request, reply) {
    try {
      const {
        titulo, descripcion, image_url, enlace_destino, texto_opcional,
        categoria = 'general', prioridad = 1, activo = true,
        impresiones_maximas = 0
      } = request.body;
      
      // Validaciones básicas
      if (!titulo || !enlace_destino) {
        return reply.code(400).send({
          error: 'Datos incompletos',
          message: 'El título y enlace de destino son obligatorios'
        });
      }
      
      const [result] = await pool.query(`
        INSERT INTO ads (
          titulo, descripcion, image_url, enlace_destino, texto_opcional,
          categoria, prioridad, activo, impresiones_maximas, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        titulo, descripcion, image_url, enlace_destino, texto_opcional,
        categoria, prioridad, activo, impresiones_maximas, request.user.id
      ]);
      
      return reply.code(201).send({
        success: true,
        message: 'Anuncio creado exitosamente',
        data: { id: result.insertId }
      });
    } catch (error) {
      request.log.error('Error al crear anuncio:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el anuncio'
      });
    }
  }

  /**
   * Actualizar un anuncio
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async updateAd(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      // Verificar que el anuncio existe
      const [existing] = await pool.query('SELECT id FROM ads WHERE id = ?', [id]);
      if (existing.length === 0) {
        return reply.code(404).send({
          error: 'Anuncio no encontrado',
          message: 'El anuncio especificado no existe'
        });
      }
      
      // Construir query de actualización dinámicamente
      const allowedFields = [
        'titulo', 'descripcion', 'image_url', 'enlace_destino', 'texto_opcional',
        'categoria', 'prioridad', 'activo', 'impresiones_maximas'
      ];
      
      const updates = [];
      const values = [];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
      
      if (updates.length === 0) {
        return reply.code(400).send({
          error: 'Sin datos para actualizar',
          message: 'No se proporcionaron campos para actualizar'
        });
      }
      
      values.push(id);
      
      await pool.query(`
        UPDATE ads SET ${updates.join(', ')} WHERE id = ?
      `, values);
      
      return {
        success: true,
        message: 'Anuncio actualizado exitosamente'
      };
    } catch (error) {
      request.log.error('Error al actualizar anuncio:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el anuncio'
      });
    }
  }

  /**
   * Eliminar un anuncio
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async deleteAd(request, reply) {
    try {
      const { id } = request.params;
      
      const [result] = await pool.query('DELETE FROM ads WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return reply.code(404).send({
          error: 'Anuncio no encontrado',
          message: 'El anuncio especificado no existe'
        });
      }
      
      return {
        success: true,
        message: 'Anuncio eliminado exitosamente'
      };
    } catch (error) {
      request.log.error('Error al eliminar anuncio:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el anuncio'
      });
    }
  }

  /**
   * Registrar impresión de anuncio
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async registerImpression(request, reply) {
    try {
      const { id } = request.params;
      
      await pool.query(`
        UPDATE ads 
        SET impresiones_actuales = impresiones_actuales + 1 
        WHERE id = ? AND activo = TRUE
      `, [id]);
      
      return {
        success: true,
        message: 'Impresión registrada'
      };
    } catch (error) {
      request.log.error('Error al registrar impresión:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo registrar la impresión'
      });
    }
  }

  /**
   * Registrar clic en anuncio
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async registerClick(request, reply) {
    try {
      const { id } = request.params;
      
      await pool.query(`
        UPDATE ads 
        SET clics_count = clics_count + 1 
        WHERE id = ? AND activo = TRUE
      `, [id]);
      
      return {
        success: true,
        message: 'Clic registrado'
      };
    } catch (error) {
      request.log.error('Error al registrar clic:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el clic'
      });
    }
  }

  /**
   * Obtener estadísticas de anuncios
   * @param {Object} request - Request de Fastify
   * @param {Object} reply - Reply de Fastify
   */
  async getAdStats(request, reply) {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_ads,
          COUNT(CASE WHEN activo = TRUE THEN 1 END) as ads_activos,
          COUNT(CASE WHEN activo = FALSE THEN 1 END) as ads_inactivos,
          SUM(impresiones_actuales) as total_impresiones,
          SUM(clics_count) as total_clics,
          AVG(CASE WHEN clics_count > 0 THEN (clics_count / impresiones_actuales) * 100 ELSE 0 END) as ctr_promedio
        FROM ads
      `);
      
      return {
        success: true,
        data: stats[0]
      };
    } catch (error) {
      request.log.error('Error al obtener estadísticas de anuncios:', error);
      return reply.code(500).send({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas'
      });
    }
  }
}

module.exports = new AdsController(); 