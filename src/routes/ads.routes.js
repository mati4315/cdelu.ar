const adsController = require('../controllers/adsController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * Esquemas de validación para las rutas de anuncios
 */
const schemas = {
  // Esquema para crear/actualizar anuncio
  adBodySchema: {
    type: 'object',
    required: ['titulo', 'enlace_destino'],
    properties: {
      titulo: { type: 'string', minLength: 1, maxLength: 255 },
      descripcion: { type: 'string' },
      image_url: { type: 'string', format: 'uri' },
      enlace_destino: { type: 'string', format: 'uri' },
      texto_opcional: { type: 'string', maxLength: 255 },
      categoria: { type: 'string', default: 'general' },
      prioridad: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
      activo: { type: 'boolean', default: true },
      impresiones_maximas: { type: 'integer', minimum: 0, default: 0 }
    }
  },

  // Esquema para respuesta de anuncio
  adResponseSchema: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      image_url: { type: 'string', nullable: true },
      enlace_destino: { type: 'string' },
      texto_opcional: { type: 'string', nullable: true },
      categoria: { type: 'string' },
      prioridad: { type: 'integer' },
      activo: { type: 'boolean' },
      impresiones_maximas: { type: 'integer' },
      impresiones_actuales: { type: 'integer' },
      clics_count: { type: 'integer' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      created_by_name: { type: 'string', nullable: true }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de anuncios
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function adsRoutes(fastify, options) {
  

  
  // Obtener anuncios activos (público)
  fastify.get('/api/v1/ads/active', {
    schema: {
      tags: ['Publicidad'],
      summary: 'Obtener anuncios activos',
      description: 'Endpoint público para obtener anuncios activos para el feed',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          categoria: { type: 'string', description: 'Filtrar por categoría' }
        }
      },
      response: {
        200: {
          description: 'Anuncios activos obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  titulo: { type: 'string' },
                  descripcion: { type: 'string' },
                  image_url: { type: 'string', nullable: true },
                  enlace_destino: { type: 'string' },
                  texto_opcional: { type: 'string', nullable: true },
                  categoria: { type: 'string' },
                  prioridad: { type: 'integer' },
                  activo: { type: 'boolean' },
                  impresiones_maximas: { type: 'integer' },
                  impresiones_actuales: { type: 'integer' },
                  clics_count: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, adsController.getActiveAds);

  // Obtener todos los anuncios (administración)
  fastify.get('/api/v1/ads', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Obtener todos los anuncios',
      description: 'Endpoint para administradores - obtener todos los anuncios con paginación',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          categoria: { type: 'string', description: 'Filtrar por categoría' },
          activo: { type: 'string', enum: ['true', 'false', ''], description: 'Filtrar por estado activo' }
        }
      },
      response: {
        200: {
          description: 'Anuncios obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  titulo: { type: 'string' },
                  descripcion: { type: 'string' },
                  image_url: { type: 'string', nullable: true },
                  enlace_destino: { type: 'string' },
                  texto_opcional: { type: 'string', nullable: true },
                  categoria: { type: 'string' },
                  prioridad: { type: 'integer' },
                  activo: { type: 'boolean' },
                  impresiones_maximas: { type: 'integer' },
                  impresiones_actuales: { type: 'integer' },
                  clics_count: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  created_by_name: { type: 'string', nullable: true }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, adsController.getAllAds);

  // Obtener anuncio por ID
  fastify.get('/api/v1/ads/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Obtener anuncio por ID',
      description: 'Endpoint para administradores - obtener detalles de un anuncio específico',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del anuncio' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Anuncio encontrado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                titulo: { type: 'string' },
                descripcion: { type: 'string' },
                image_url: { type: 'string', nullable: true },
                enlace_destino: { type: 'string' },
                texto_opcional: { type: 'string', nullable: true },
                categoria: { type: 'string' },
                prioridad: { type: 'integer' },
                activo: { type: 'boolean' },
                impresiones_maximas: { type: 'integer' },
                impresiones_actuales: { type: 'integer' },
                clics_count: { type: 'integer' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                created_by_name: { type: 'string', nullable: true }
              }
            }
          }
        },
        404: {
          description: 'Anuncio no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.getAdById);

  // Crear nuevo anuncio
  fastify.post('/api/v1/ads', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Crear nuevo anuncio',
      description: 'Endpoint para administradores - crear un nuevo anuncio',
      body: {
        type: 'object',
        required: ['titulo', 'enlace_destino'],
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 255 },
          descripcion: { type: 'string' },
          image_url: { type: 'string', format: 'uri' },
          enlace_destino: { type: 'string', format: 'uri' },
          texto_opcional: { type: 'string', maxLength: 255 },
          categoria: { type: 'string', default: 'general' },
          prioridad: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
          activo: { type: 'boolean', default: true },
          impresiones_maximas: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      response: {
        201: {
          description: 'Anuncio creado exitosamente',
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
        },
        400: {
          description: 'Datos inválidos',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.createAd);

  // Actualizar anuncio
  fastify.put('/api/v1/ads/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Actualizar anuncio',
      description: 'Endpoint para administradores - actualizar un anuncio existente',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del anuncio' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 255 },
          descripcion: { type: 'string' },
          image_url: { type: 'string', format: 'uri' },
          enlace_destino: { type: 'string', format: 'uri' },
          texto_opcional: { type: 'string', maxLength: 255 },
          categoria: { type: 'string' },
          prioridad: { type: 'integer', minimum: 1, maximum: 10 },
          activo: { type: 'boolean' },
          impresiones_maximas: { type: 'integer', minimum: 0 }
        }
      },
      response: {
        200: {
          description: 'Anuncio actualizado exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Anuncio no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.updateAd);

  // Eliminar anuncio
  fastify.delete('/api/v1/ads/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Eliminar anuncio',
      description: 'Endpoint para administradores - eliminar un anuncio',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del anuncio' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Anuncio eliminado exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Anuncio no encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.deleteAd);

  // Registrar impresión de anuncio (público)
  fastify.post('/api/v1/ads/:id/impression', {
    schema: {
      tags: ['Publicidad'],
      summary: 'Registrar impresión de anuncio',
      description: 'Endpoint público para registrar cuando se muestra un anuncio',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del anuncio' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Impresión registrada exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.registerImpression);

  // Registrar clic en anuncio (público)
  fastify.post('/api/v1/ads/:id/click', {
    schema: {
      tags: ['Publicidad'],
      summary: 'Registrar clic en anuncio',
      description: 'Endpoint público para registrar cuando se hace clic en un anuncio',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del anuncio' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Clic registrado exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adsController.registerClick);

  // Obtener estadísticas de anuncios
  fastify.get('/api/v1/ads/stats', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      tags: ['Publicidad'],
      summary: 'Obtener estadísticas de anuncios',
      description: 'Endpoint para administradores - obtener métricas de publicidad',
      response: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total_ads: { type: 'integer' },
                ads_activos: { type: 'integer' },
                ads_inactivos: { type: 'integer' },
                total_impresiones: { type: 'integer' },
                total_clics: { type: 'integer' },
                ctr_promedio: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, adsController.getAdStats);
}

module.exports = adsRoutes; 