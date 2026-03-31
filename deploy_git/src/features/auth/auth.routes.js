"use strict";

const { authenticate } = require('../../middlewares/auth');
const ctrl = require('./auth.controller');

/**
 * Rutas de autenticación (feature-based) manteniendo paths actuales
 * @param {import('fastify').FastifyInstance} fastify
 */
async function authRoutes(fastify) {
  // POST /api/v1/auth/register
  fastify.post('/api/v1/auth/register', {
    schema: {
      tags: ['Autenticación'],
      summary: 'Registro de nuevo usuario',
      body: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6, maxLength: 100 },
          rol: { type: 'string', enum: ['administrador', 'colaborador', 'usuario'], default: 'usuario' },
        },
      },
    },
  }, ctrl.register);

  // POST /api/v1/auth/login
  fastify.post('/api/v1/auth/login', {
    schema: {
      tags: ['Autenticación'],
      summary: 'Iniciar sesión',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, ctrl.login);

  // GET /api/v1/auth/me
  fastify.get('/api/v1/auth/me', {
    onRequest: [authenticate],
    schema: {
      tags: ['Autenticación'],
      summary: 'Obtener perfil del usuario actual',
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' },
                rol: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, ctrl.getMe);

  // PUT /api/v1/auth/me
  fastify.put('/api/v1/auth/me', {
    onRequest: [authenticate],
    schema: {
      tags: ['Autenticación'],
      summary: 'Actualizar perfil del usuario actual',
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, ctrl.updateMe);
}

module.exports = authRoutes;


