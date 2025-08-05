const surveyController = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middlewares/auth');

async function surveyRoutes(fastify, options) {
  // Middleware para verificar si el usuario es administrador
  const requireAdmin = async (request, reply) => {
    await authenticate(request, reply);
    await authorize(['administrador'])(request, reply);
  };

  // Rutas públicas (sin autenticación)
  
  // GET /api/v1/surveys - Obtener todas las encuestas (público)
  fastify.get('/api/v1/surveys', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          status: { type: 'string', enum: ['active', 'inactive', 'completed', 'all'], default: 'active' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  question: { type: 'string' },
                  status: { type: 'string' },
                  is_multiple_choice: { type: 'boolean' },
                  max_votes_per_user: { type: 'integer' },
                  total_votes: { type: 'integer' },
                  options_count: { type: 'integer' },
                  created_at: { type: 'string' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        option_text: { type: 'string' },
                        votes_count: { type: 'integer' },
                        display_order: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, surveyController.getAllSurveys);

  // GET /api/v1/surveys/active - Obtener encuestas activas (público)
  fastify.get('/api/v1/surveys/active', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  question: { type: 'string' },
                  is_multiple_choice: { type: 'boolean' },
                  max_votes_per_user: { type: 'integer' },
                  total_votes: { type: 'integer' },
                  options_count: { type: 'integer' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        option_text: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, surveyController.getActiveSurveys);

  // GET /api/v1/surveys/:id - Obtener encuesta específica (público)
  fastify.get('/api/v1/surveys/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                question: { type: 'string' },
                status: { type: 'string' },
                is_multiple_choice: { type: 'boolean' },
                max_votes_per_user: { type: 'integer' },
                total_votes: { type: 'integer' },
                user_voted: { type: 'boolean' },
                user_votes: {
                  type: 'array',
                  items: { type: 'integer' }
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      option_text: { type: 'string' },
                      votes_count: { type: 'integer' },
                      percentage: { type: 'number' },
                      display_order: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, surveyController.getSurveyById);

  // GET /api/v1/surveys/:id/stats - Obtener estadísticas de encuesta (público)
  fastify.get('/api/v1/surveys/:id/stats', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                question: { type: 'string' },
                total_votes: { type: 'integer' },
                registered_voters: { type: 'integer' },
                unique_ips: { type: 'integer' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      option_text: { type: 'string' },
                      votes_count: { type: 'integer' },
                      percentage: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, surveyController.getSurveyStats);

  // POST /api/v1/surveys/:id/vote - Votar en encuesta (requiere autenticación)
  fastify.post('/api/v1/surveys/:id/vote', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          option_ids: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1
          }
        },
        required: ['option_ids']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, surveyController.voteSurvey);

  // Rutas protegidas (solo administradores)
  
  // POST /api/v1/surveys - Crear nueva encuesta (admin)
  fastify.post('/api/v1/surveys', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        properties: {
          question: { type: 'string', minLength: 1 },
          options: {
            type: 'array',
            items: { type: 'string', minLength: 1, maxLength: 500 },
            minItems: 2,
            maxItems: 10
          },
          is_multiple_choice: { type: 'boolean', default: false },
          max_votes_per_user: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
          expires_at: { type: 'string', format: 'date-time' }
        },
        required: ['question', 'options']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, surveyController.createSurvey);

  // PUT /api/v1/surveys/:id - Actualizar encuesta (admin)
  fastify.put('/api/v1/surveys/:id', {
    preHandler: requireAdmin,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          question: { type: 'string', minLength: 1 },
          status: { type: 'string', enum: ['active', 'inactive', 'completed'] },
          is_multiple_choice: { type: 'boolean' },
          max_votes_per_user: { type: 'integer', minimum: 1, maximum: 10 },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, surveyController.updateSurvey);

  // DELETE /api/v1/surveys/:id - Eliminar encuesta (admin)
  fastify.delete('/api/v1/surveys/:id', {
    preHandler: requireAdmin,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, surveyController.deleteSurvey);
}

module.exports = surveyRoutes; 