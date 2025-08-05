const pool = require('../config/database');

class SurveyController {
  // Obtener todas las encuestas (con paginación)
  async getAllSurveys(request, reply) {
    try {
      const { page = 1, limit = 10, status = 'active' } = request.query;
      const offset = (page - 1) * limit;
      
      // Construir la consulta base
      let whereClause = '';
      const params = [];
      
      if (status && status !== 'all') {
        whereClause = 'WHERE s.status = ?';
        params.push(status);
      }
      
      // Contar total de encuestas
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM surveys s 
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0].total;
      
      // Obtener encuestas con opciones
      const query = `
        SELECT 
          s.*,
          COUNT(DISTINCT so.id) as options_count,
          COUNT(DISTINCT sv.id) as total_votes
        FROM surveys s
        LEFT JOIN survey_options so ON s.id = so.survey_id
        LEFT JOIN survey_votes sv ON s.id = sv.survey_id
        ${whereClause}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [surveys] = await pool.execute(query, [...params, parseInt(limit), offset]);
      
      // Obtener opciones para cada encuesta
      for (let survey of surveys) {
        const [options] = await pool.execute(
          'SELECT id, option_text, votes_count, display_order FROM survey_options WHERE survey_id = ? ORDER BY display_order, id',
          [survey.id]
        );
        survey.options = options;
      }
      
      reply.send({
        success: true,
        data: surveys,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener encuestas:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las encuestas'
      });
    }
  }

  // Obtener una encuesta específica con resultados
  async getSurveyById(request, reply) {
    try {
      const { id } = request.params;
      
      // Obtener encuesta con total de votos
      const [surveys] = await pool.execute(`
        SELECT 
          s.*,
          COUNT(DISTINCT sv.id) as total_votes
        FROM surveys s
        LEFT JOIN survey_votes sv ON s.id = sv.survey_id
        WHERE s.id = ?
        GROUP BY s.id
      `, [id]);
      
      if (surveys.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Encuesta no encontrada',
          message: 'La encuesta solicitada no existe'
        });
      }
      
      const survey = surveys[0];
      
      // Obtener opciones con estadísticas calculadas correctamente
      const [options] = await pool.execute(`
        SELECT 
          so.id,
          so.option_text,
          so.display_order,
          COUNT(sv.id) as votes_count,
          ROUND((COUNT(sv.id) / NULLIF(?, 0)) * 100, 2) as percentage
        FROM survey_options so
        LEFT JOIN survey_votes sv ON so.id = sv.option_id
        WHERE so.survey_id = ?
        GROUP BY so.id, so.option_text, so.display_order
        ORDER BY so.display_order, so.id
      `, [survey.total_votes, id]);
      
      survey.options = options;
      
      // Verificar si el usuario ya votó
      let userVoted = false;
      let userVotes = [];
      
      if (request.user) {
        const [userVotesResult] = await pool.execute(
          'SELECT option_id FROM survey_votes WHERE survey_id = ? AND user_id = ?',
          [id, request.user.id]
        );
        userVoted = userVotesResult.length > 0;
        userVotes = userVotesResult.map(v => v.option_id);
      } else {
        // Verificar por IP para usuarios anónimos
        const userIp = request.ip;
        const [ipVotesResult] = await pool.execute(
          'SELECT option_id FROM survey_votes WHERE survey_id = ? AND user_ip = ?',
          [id, userIp]
        );
        userVoted = ipVotesResult.length > 0;
        userVotes = ipVotesResult.map(v => v.option_id);
      }
      
      survey.user_voted = userVoted;
      survey.user_votes = userVotes;
      
      reply.send({
        success: true,
        data: survey
      });
    } catch (error) {
      console.error('Error al obtener encuesta:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la encuesta'
      });
    }
  }

  // Crear nueva encuesta (solo administradores)
  async createSurvey(request, reply) {
    try {
      const { question, options, is_multiple_choice = false, max_votes_per_user = 1, expires_at = null } = request.body;
      
      // Validaciones
      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return reply.code(400).send({
          success: false,
          error: 'Datos inválidos',
          message: 'Se requiere pregunta y al menos 2 opciones'
        });
      }
      
      // Iniciar transacción
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Crear encuesta
        const [surveyResult] = await connection.execute(
          `INSERT INTO surveys (question, is_multiple_choice, max_votes_per_user, created_by, expires_at) 
           VALUES (?, ?, ?, ?, ?)`,
          [question, is_multiple_choice, max_votes_per_user, request.user.id, expires_at]
        );
        
        const surveyId = surveyResult.insertId;
        
        // Crear opciones
        for (let i = 0; i < options.length; i++) {
          await connection.execute(
            'INSERT INTO survey_options (survey_id, option_text, display_order) VALUES (?, ?, ?)',
            [surveyId, options[i], i + 1]
          );
        }
        
        await connection.commit();
        
        reply.code(201).send({
          success: true,
          message: 'Encuesta creada exitosamente',
          data: { id: surveyId }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear encuesta:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear la encuesta'
      });
    }
  }

  // Actualizar encuesta (solo administradores)
  async updateSurvey(request, reply) {
    try {
      const { id } = request.params;
      const { question, status, is_multiple_choice, max_votes_per_user, expires_at } = request.body;
      
      // Verificar que la encuesta existe
      const [surveys] = await pool.execute(
        'SELECT * FROM surveys WHERE id = ?',
        [id]
      );
      
      if (surveys.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Encuesta no encontrada',
          message: 'La encuesta solicitada no existe'
        });
      }
      
      // Actualizar encuesta
      const updateFields = [];
      const updateValues = [];
      
      if (question !== undefined) {
        updateFields.push('question = ?');
        updateValues.push(question);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      if (is_multiple_choice !== undefined) {
        updateFields.push('is_multiple_choice = ?');
        updateValues.push(is_multiple_choice);
      }
      if (max_votes_per_user !== undefined) {
        updateFields.push('max_votes_per_user = ?');
        updateValues.push(max_votes_per_user);
      }
      if (expires_at !== undefined) {
        updateFields.push('expires_at = ?');
        updateValues.push(expires_at);
      }
      
      if (updateFields.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Datos inválidos',
          message: 'No se proporcionaron datos para actualizar'
        });
      }
      
      updateValues.push(id);
      
      await pool.execute(
        `UPDATE surveys SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      reply.send({
        success: true,
        message: 'Encuesta actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar encuesta:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la encuesta'
      });
    }
  }

  // Eliminar encuesta (solo administradores)
  async deleteSurvey(request, reply) {
    try {
      const { id } = request.params;
      
      // Verificar que la encuesta existe
      const [surveys] = await pool.execute(
        'SELECT * FROM surveys WHERE id = ?',
        [id]
      );
      
      if (surveys.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Encuesta no encontrada',
          message: 'La encuesta solicitada no existe'
        });
      }
      
      // Eliminar encuesta (los votos y opciones se eliminan en cascada)
      await pool.execute('DELETE FROM surveys WHERE id = ?', [id]);
      
      reply.send({
        success: true,
        message: 'Encuesta eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar encuesta:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la encuesta'
      });
    }
  }

  // Votar en una encuesta
  async voteSurvey(request, reply) {
    try {
      const { id } = request.params;
      const { option_ids } = request.body;
      
      // Verificar que el usuario esté autenticado
      if (!request.user || !request.user.id) {
        return reply.code(401).send({
          success: false,
          error: 'No autorizado',
          message: 'Debes estar logueado para votar en las encuestas'
        });
      }
      
      // Validar que option_ids sea un array
      if (!Array.isArray(option_ids) || option_ids.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Datos inválidos',
          message: 'Se debe seleccionar al menos una opción'
        });
      }
      
      // Obtener información de la encuesta
      const [surveys] = await pool.execute(
        'SELECT * FROM surveys WHERE id = ? AND status = "active"',
        [id]
      );
      
      if (surveys.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Encuesta no encontrada',
          message: 'La encuesta no existe o no está activa'
        });
      }
      
      const survey = surveys[0];
      
      // Verificar que las opciones existen y pertenecen a esta encuesta
      const placeholders = option_ids.map(() => '?').join(',');
      const [options] = await pool.execute(
        `SELECT id FROM survey_options WHERE id IN (${placeholders}) AND survey_id = ?`,
        [...option_ids, id]
      );
      
      if (options.length !== option_ids.length) {
        return reply.code(400).send({
          success: false,
          error: 'Opciones inválidas',
          message: 'Una o más opciones seleccionadas no son válidas'
        });
      }
      
      // Verificar límite de votos por usuario
      if (option_ids.length > survey.max_votes_per_user) {
        return reply.code(400).send({
          success: false,
          error: 'Demasiados votos',
          message: `Solo se permiten ${survey.max_votes_per_user} voto(s) por usuario`
        });
      }
      
      // Verificar si el usuario ya votó (solo por user_id ahora)
      const [existingVotes] = await pool.execute(
        'SELECT option_id FROM survey_votes WHERE survey_id = ? AND user_id = ?',
        [id, request.user.id]
      );
      
      if (existingVotes.length > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Ya votaste',
          message: 'Ya has votado en esta encuesta'
        });
      }
      
      // Iniciar transacción para insertar votos
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Insertar votos con has_voted = TRUE
        for (const optionId of option_ids) {
          await connection.execute(
            'INSERT INTO survey_votes (survey_id, option_id, user_id, user_ip, user_agent, has_voted) VALUES (?, ?, ?, ?, ?, TRUE)',
            [id, optionId, request.user.id, request.ip, request.headers['user-agent'] || null]
          );
        }
        
        await connection.commit();
        
        reply.send({
          success: true,
          message: 'Voto registrado exitosamente',
          data: {
            survey_id: id,
            has_voted: true,
            show_options: false
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al votar:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el voto'
      });
    }
  }

  // Obtener estadísticas de una encuesta
  async getSurveyStats(request, reply) {
    try {
      const { id } = request.params;
      
      // Obtener encuesta con estadísticas
      const [surveys] = await pool.execute(`
        SELECT 
          s.*,
          COUNT(DISTINCT sv.id) as total_votes,
          COUNT(DISTINCT CASE WHEN sv.user_id IS NOT NULL THEN sv.user_id END) as registered_voters,
          COUNT(DISTINCT sv.user_ip) as unique_ips
        FROM surveys s
        LEFT JOIN survey_votes sv ON s.id = sv.survey_id
        WHERE s.id = ?
        GROUP BY s.id
      `, [id]);
      
      if (surveys.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Encuesta no encontrada',
          message: 'La encuesta solicitada no existe'
        });
      }
      
      const survey = surveys[0];
      
      // Obtener estadísticas detalladas por opción
      const [options] = await pool.execute(`
        SELECT 
          so.*,
          ROUND((so.votes_count / NULLIF(?, 0)) * 100, 2) as percentage
        FROM survey_options so
        WHERE so.survey_id = ?
        ORDER BY so.display_order, so.id
      `, [survey.total_votes, id]);
      
      survey.options = options;
      
      reply.send({
        success: true,
        data: survey
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas'
      });
    }
  }

  // Obtener encuestas activas para el frontend
  async getActiveSurveys(request, reply) {
    try {
      console.log('🔍 DEBUG: getActiveSurveys iniciado');
      const { limit = 5 } = request.query;
      const userId = request.user ? request.user.id : null;
      
      console.log(`🔍 DEBUG: limit=${limit}, userId=${userId}`);
      
      // Obtener encuestas activas con total de votos
      const [surveys] = await pool.execute(`
        SELECT 
          s.id, s.question, s.is_multiple_choice, s.max_votes_per_user,
          COUNT(DISTINCT so.id) as options_count,
          COUNT(DISTINCT sv.id) as total_votes
        FROM surveys s
        LEFT JOIN survey_options so ON s.id = so.survey_id
        LEFT JOIN survey_votes sv ON s.id = sv.survey_id
        WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);
      
      console.log(`🔍 DEBUG: Encuestas encontradas: ${surveys.length}`);
      
      // Obtener opciones con conteo de votos y verificar estado de votación para cada encuesta
      for (let survey of surveys) {
        console.log(`🔍 DEBUG: Procesando survey ${survey.id} con ${survey.total_votes} votos totales`);
        
        // Obtener opciones con estadísticas
        const [options] = await pool.execute(`
          SELECT 
            so.id, 
            so.option_text,
            so.display_order,
            COUNT(sv.id) as votes_count,
            ROUND((COUNT(sv.id) / NULLIF(?, 0)) * 100, 2) as percentage
          FROM survey_options so
          LEFT JOIN survey_votes sv ON so.id = sv.option_id
          WHERE so.survey_id = ?
          GROUP BY so.id, so.option_text, so.display_order
          ORDER BY so.display_order, so.id
        `, [survey.total_votes, survey.id]);
        
        console.log(`🔍 DEBUG: Opciones para survey ${survey.id}:`, options);
        
        // Verificar si el usuario ya votó (sistema de estado binario)
        let hasVoted = false;
        if (userId) {
          // Solo usuarios autenticados pueden votar
          console.log(`🔍 DEBUG: Usuario autenticado ${userId}, verificando votos...`);
          const [userVote] = await pool.execute(`
            SELECT id FROM survey_votes 
            WHERE survey_id = ? AND user_id = ? AND has_voted = TRUE
            LIMIT 1
          `, [survey.id, userId]);
          hasVoted = userVote.length > 0;
          console.log(`🔍 DEBUG: Usuario ${userId} - Votos encontrados: ${userVote.length}, hasVoted: ${hasVoted}`);
        } else {
          // Usuarios anónimos/invitados NO pueden votar
          // Siempre mostrar opciones para que puedan ver la encuesta y hacer login
          hasVoted = false;
          console.log(`🔍 DEBUG: Usuario anónimo - No puede votar, mostrando opciones para login`);
        }
        
        // Agregar campos del sistema de estado binario
        survey.has_voted = hasVoted;
        survey.show_options = !hasVoted; // true si no ha votado, false si ya votó
        survey.options = options;
        
        console.log(`🔍 DEBUG: Survey ${survey.id} preparado con has_voted=${hasVoted}, show_options=${!hasVoted}, opciones=${options.length}`);
      }
      
      console.log('🔍 DEBUG: Enviando respuesta con', surveys.length, 'encuestas');
      
      reply.send({
        success: true,
        data: surveys
      });
    } catch (error) {
      console.error('❌ ERROR en getActiveSurveys:', error);
      reply.code(500).send({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las encuestas activas'
      });
    }
  }
}

module.exports = new SurveyController(); 