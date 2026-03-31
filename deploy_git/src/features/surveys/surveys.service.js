"use strict";

// Servicio de aplicación para Encuestas
// Orquesta reglas de negocio y delega acceso a datos al repositorio

const repo = require('./surveys.repository');

async function listSurveys(params) {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  const status = params.status || 'active';
  const offset = (page - 1) * limit;

  const total = await repo.countSurveysByStatus(status);
  const data = await repo.fetchSurveysWithCounts(status, limit, offset);

  // Enriquecer con opciones y estado de voto del usuario (batch)
  const surveyIds = data.map(s => s.id);
  let votesMap = new Map();
  if (surveyIds.length > 0 && (params?.__user?.id || false)) {
    // Nota: pasamos user via controller usando request.user
    votesMap = await repo.fetchUserVotesForSurveys(surveyIds, params.__user.id);
  }

  for (const survey of data) {
    survey.options = await repo.fetchOptionsBasic(survey.id);
    const userVotes = votesMap.get(survey.id) || [];
    survey.has_voted = userVotes.length > 0;
    survey.user_votes = userVotes;
    // Normalizar expires_at en ISO 8601 si existe
    if (survey.expires_at) survey.expires_at = new Date(survey.expires_at).toISOString();
  }

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    server_time: new Date().toISOString(),
  };
}

async function getSurveyById(id, user) {
  const survey = await repo.fetchSurveyByIdWithTotalVotes(id);
  if (!survey) return null;
  const options = await repo.fetchOptionsWithStats(id, survey.total_votes);

  let userVoted = false;
  let userVotes = [];
  if (user?.id) {
    // Para mantener compatibilidad, traer votos del usuario
    userVotes = await repo.fetchUserVotesForSurvey(id, user.id);
    userVoted = userVotes.length > 0;
  }

  // Normalizar expires_at
  if (survey.expires_at) survey.expires_at = new Date(survey.expires_at).toISOString();

  return {
    success: true,
    data: {
      ...survey,
      options,
      user_voted: userVoted,
      user_votes: userVotes,
    },
    server_time: new Date().toISOString(),
  };
}

async function createSurvey(input, currentUserId) {
  if (!input.question || !Array.isArray(input.options) || input.options.length < 2) {
    return { success: false, statusCode: 400, error: 'Datos inválidos', message: 'Se requiere pregunta y al menos 2 opciones' };
  }
  const connection = await repo.pool.getConnection();
  try {
    await connection.beginTransaction();
    const surveyId = await repo.createSurveyWithOptions(connection, {
      question: input.question,
      is_multiple_choice: Boolean(input.is_multiple_choice),
      max_votes_per_user: Number(input.max_votes_per_user || 1),
      created_by: currentUserId,
      expires_at: input.expires_at ?? null,
      options: input.options,
    });
    await connection.commit();
    return { success: true, statusCode: 201, message: 'Encuesta creada exitosamente', data: { id: surveyId } };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function updateSurvey(id, input) {
  const exists = await repo.fetchSurveyById(id);
  if (!exists) return { notFound: true };
  const affected = await repo.updateSurveyById(id, input);
  if (affected === 0) return { badRequest: true };
  return { success: true, message: 'Encuesta actualizada exitosamente' };
}

async function deleteSurvey(id) {
  const exists = await repo.fetchSurveyById(id);
  if (!exists) return { notFound: true };
  await repo.deleteSurveyById(id);
  return { success: true, message: 'Encuesta eliminada exitosamente' };
}

async function voteSurvey(id, optionIds, user, reqMeta) {
  if (!user?.id) {
    return { statusCode: 401, error: 'No autorizado', message: 'Debes estar logueado para votar en las encuestas' };
  }
  if (!Array.isArray(optionIds) || optionIds.length === 0) {
    return { statusCode: 400, error: 'Datos inválidos', message: 'Se debe seleccionar al menos una opción' };
  }
  const survey = await repo.fetchSurveyById(id);
  if (!survey || survey.status !== 'active') {
    return { statusCode: 404, error: 'Encuesta no encontrada', message: 'La encuesta no existe o no está activa' };
  }
  // Bloqueo si expiró
  if (survey.expires_at && new Date(survey.expires_at) <= new Date()) {
    return { statusCode: 409, error: 'Encuesta expirada', message: 'La encuesta ha expirado' };
  }
  // Bloqueo si ya votó el usuario
  if (user?.id) {
    const previous = await repo.fetchUserVotesForSurvey(id, user.id);
    if (previous.length > 0) {
      return { statusCode: 400, error: 'Voto duplicado', message: 'Ya has votado en esta encuesta' };
    }
  }
  const validOptions = await repo.fetchValidOptionsForSurvey(optionIds, id);
  if (validOptions.length !== optionIds.length) {
    return { statusCode: 400, error: 'Opciones inválidas', message: 'Una o más opciones seleccionadas no son válidas' };
  }
  const connection = await repo.pool.getConnection();
  try {
    await connection.beginTransaction();
    await repo.insertVotes(connection, id, optionIds, user.id, reqMeta.ip, reqMeta.userAgent);
    await connection.commit();
    return { success: true, message: 'Voto registrado exitosamente', data: { survey_id: id, has_voted: true, show_options: false } };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function listActiveSurveys(limit, user) {
  const surveys = await repo.fetchActiveSurveysWithCounts(limit);
  for (const survey of surveys) {
    const options = await repo.fetchOptionsWithStats(survey.id, survey.total_votes);
    let hasVoted = false;
    let userVotes = [];
    if (user?.id) {
      hasVoted = await repo.fetchUserVoteForSurvey(survey.id, user.id);
      if (hasVoted) {
        userVotes = await repo.fetchUserVotesForSurvey(survey.id, user.id);
      }
    }
    survey.has_voted = hasVoted;
    survey.user_votes = userVotes;
    survey.show_options = !hasVoted;
    survey.options = options;
    if (survey.expires_at) survey.expires_at = new Date(survey.expires_at).toISOString();
  }
  return { success: true, data: surveys, server_time: new Date().toISOString() };
}

async function getSurveyStats(id) {
  const [surveys] = await repo.pool.execute(
    `SELECT 
       s.*,
       COUNT(DISTINCT sv.id) as total_votes,
       COUNT(DISTINCT CASE WHEN sv.user_id IS NOT NULL THEN sv.user_id END) as registered_voters,
       COUNT(DISTINCT sv.user_ip) as unique_ips
     FROM surveys s
     LEFT JOIN survey_votes sv ON s.id = sv.survey_id
     WHERE s.id = ?
     GROUP BY s.id`,
    [id]
  );
  if (surveys.length === 0) return null;
  const survey = surveys[0];
  const [options] = await repo.pool.execute(
    `SELECT so.*, ROUND((so.votes_count / NULLIF(?, 0)) * 100, 2) as percentage
     FROM survey_options so
     WHERE so.survey_id = ?
     ORDER BY so.display_order, so.id`,
    [survey.total_votes, id]
  );
  survey.options = options;
  return { success: true, data: survey };
}

module.exports = {
  listSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  voteSurvey,
  listActiveSurveys,
  getSurveyStats,
};


