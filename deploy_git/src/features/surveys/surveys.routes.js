"use strict";

// Rutas feature-based para Encuestas, manteniendo paths actuales para compatibilidad

const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./surveys.controller');

async function surveysRoutes(fastify) {
  // GET /api/v1/surveys
  fastify.get('/api/v1/surveys', {
    schema: {
      tags: ['Encuestas'],
      summary: 'Listar encuestas',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          status: { type: 'string', enum: ['active', 'inactive', 'completed', 'all'], default: 'active' },
        },
      },
    },
  }, ctrl.getAllSurveys);

  // GET /api/v1/surveys/active
  fastify.get('/api/v1/surveys/active', {
    schema: {
      tags: ['Encuestas'],
      summary: 'Listar encuestas activas',
      querystring: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 } },
      },
    },
  }, ctrl.getActiveSurveys);

  // GET /api/v1/surveys/:id
  fastify.get('/api/v1/surveys/:id', {
    schema: {
      tags: ['Encuestas'],
      summary: 'Obtener encuesta por ID',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
    },
  }, ctrl.getSurveyById);

  // GET /api/v1/surveys/:id/stats
  fastify.get('/api/v1/surveys/:id/stats', {
    schema: {
      tags: ['Encuestas'],
      summary: 'Estadísticas de encuesta',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
    },
  }, ctrl.getSurveyStats);

  // POST /api/v1/surveys/:id/vote
  fastify.post('/api/v1/surveys/:id/vote', {
    onRequest: [authenticate],
    schema: {
      tags: ['Encuestas'],
      summary: 'Votar encuesta',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: { type: 'object', required: ['option_ids'], properties: { option_ids: { type: 'array', items: { type: 'integer' }, minItems: 1 } } },
    },
  }, ctrl.voteSurvey);

  // POST /api/v1/surveys (admin)
  fastify.post('/api/v1/surveys', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Encuestas'],
      summary: 'Crear encuesta',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['question', 'options'],
        properties: {
          question: { type: 'string', minLength: 1 },
          options: { type: 'array', minItems: 2, maxItems: 10, items: { type: 'string', minLength: 1, maxLength: 500 } },
          is_multiple_choice: { type: 'boolean', default: false },
          max_votes_per_user: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, ctrl.createSurvey);

  // PUT /api/v1/surveys/:id (admin)
  fastify.put('/api/v1/surveys/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Encuestas'],
      summary: 'Actualizar encuesta',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: {
        type: 'object',
        properties: {
          question: { type: 'string', minLength: 1 },
          status: { type: 'string', enum: ['active', 'inactive', 'completed'] },
          is_multiple_choice: { type: 'boolean' },
          max_votes_per_user: { type: 'integer', minimum: 1, maximum: 10 },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, ctrl.updateSurvey);

  // DELETE /api/v1/surveys/:id (admin)
  fastify.delete('/api/v1/surveys/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Encuestas'],
      summary: 'Eliminar encuesta',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
    },
  }, ctrl.deleteSurvey);
}

module.exports = surveysRoutes;


