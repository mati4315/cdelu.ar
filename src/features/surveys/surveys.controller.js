"use strict";

// Controlador fino de Encuestas: delega en service y gestiona HTTP

const service = require('./surveys.service');

async function getAllSurveys(request, reply) {
  try {
    const params = { ...(request.query || {}), __user: request.user };
    const result = await service.listSurveys(params);
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al obtener encuestas' });
  }
}

async function getActiveSurveys(request, reply) {
  try {
    const limit = Number((request.query && request.query.limit) || 5);
    const result = await service.listActiveSurveys(limit, request.user);
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al obtener encuestas activas' });
  }
}

async function getSurveyById(request, reply) {
  try {
    const result = await service.getSurveyById(Number(request.params.id), request.user);
    if (!result) return reply.status(404).send({ success: false, error: 'Encuesta no encontrada' });
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al obtener la encuesta' });
  }
}

async function getSurveyStats(request, reply) {
  try {
    const result = await service.getSurveyStats(Number(request.params.id));
    if (!result) return reply.status(404).send({ success: false, error: 'Encuesta no encontrada' });
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al obtener estadísticas' });
  }
}

async function createSurvey(request, reply) {
  try {
    const res = await service.createSurvey(request.body, request.user.id);
    if (res.statusCode) return reply.status(res.statusCode).send(res);
    return reply.status(201).send(res);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al crear la encuesta' });
  }
}

async function updateSurvey(request, reply) {
  try {
    const result = await service.updateSurvey(Number(request.params.id), request.body);
    if (result?.notFound) return reply.status(404).send({ success: false, error: 'Encuesta no encontrada' });
    if (result?.badRequest) return reply.status(400).send({ success: false, error: 'Datos inválidos' });
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al actualizar la encuesta' });
  }
}

async function deleteSurvey(request, reply) {
  try {
    const result = await service.deleteSurvey(Number(request.params.id));
    if (result?.notFound) return reply.status(404).send({ success: false, error: 'Encuesta no encontrada' });
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al eliminar la encuesta' });
  }
}

async function voteSurvey(request, reply) {
  try {
    const optionIds = request.body.option_ids;
    const res = await service.voteSurvey(Number(request.params.id), optionIds, request.user, { ip: request.ip, userAgent: request.headers['user-agent'] });
    if (res.statusCode) return reply.status(res.statusCode).send(res);
    return reply.send(res);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Error al votar' });
  }
}

module.exports = {
  getAllSurveys,
  getActiveSurveys,
  getSurveyById,
  getSurveyStats,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  voteSurvey,
};


