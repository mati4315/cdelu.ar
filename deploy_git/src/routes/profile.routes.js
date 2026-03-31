const userController = require('../controllers/userController');
const { validateProfilePicture, requireAuthentication } = require('../middlewares/profileValidation');

/**
 * Rutas para gestión de perfiles de usuario
 * Incluye subida, eliminación y consulta de fotos de perfil
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function profileRoutes(fastify, options) {
  
  // Esquemas para validación y documentación
  const uploadProfilePictureSchema = {
    description: 'Subir o actualizar foto de perfil del usuario autenticado',
    tags: ['Profile'],
    security: [{ BearerAuth: [] }],
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        profile_picture: {
          type: 'object',
          description: 'Archivo de imagen para la foto de perfil (máximo 5MB, formatos: jpg, png, webp)'
        }
      },
      required: ['profile_picture']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          profile_picture_url: { type: 'string' }
        }
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  const removeProfilePictureSchema = {
    description: 'Eliminar foto de perfil del usuario autenticado',
    tags: ['Profile'],
    security: [{ BearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  const getUserProfileSchema = {
    description: 'Obtener perfil completo del usuario autenticado',
    tags: ['Profile'],
    security: [{ BearerAuth: [] }],
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
              profile_picture_url: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              // Campo adicional opcional para compatibilidad con frontend
              comments_count: { type: 'integer' }
            }
          },
          // Bloque opcional de estadísticas del perfil
          stats: {
            type: 'object',
            nullable: true,
            properties: {
              lottery_participations: { type: 'integer' },
              lottery_wins: { type: 'integer' },
              community_posts_count: { type: 'integer' }
            }
          }
        }
      }
    }
  };

  const getPublicUserProfileSchema = {
    description: 'Obtener perfil público de un usuario por ID',
    tags: ['Profile'],
    params: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: 'ID del usuario' }
      },
      required: ['userId']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              nombre: { type: 'string' },
              rol: { type: 'string' },
              profile_picture_url: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  // POST /api/v1/profile/picture - Subir foto de perfil
  fastify.post('/picture', {
    schema: uploadProfilePictureSchema,
    preHandler: [requireAuthentication, validateProfilePicture]
  }, userController.uploadProfilePicture);

  // DELETE /api/v1/profile/picture - Eliminar foto de perfil
  fastify.delete('/picture', {
    schema: removeProfilePictureSchema,
    preHandler: requireAuthentication
  }, userController.removeProfilePicture);

  // GET /api/v1/profile/me - Obtener mi perfil
  fastify.get('/me', {
    schema: getUserProfileSchema,
    preHandler: requireAuthentication
  }, userController.getUserProfile);

  // GET /api/v1/profile/:userId - Obtener perfil público de usuario
  fastify.get('/:userId', {
    schema: getPublicUserProfileSchema
  }, userController.getPublicUserProfile);

  // === NUEVOS ENDPOINTS: Posts del perfil ===

  // Schema común para lista de posts (comunidad)
  const listUserPostsSchema = {
    description: 'Listar posts de comunidad (com) creados por un usuario',
    tags: ['Profile'],
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                titulo: { type: 'string' },
                descripcion: { type: 'string' },
                image_url: { type: 'string', nullable: true },
                image_urls: { type: 'array', items: { type: 'string' } },
                video_url: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
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
  };

  // GET /api/v1/profile/me/posts - Listar mis posts de comunidad
  fastify.get('/me/posts', {
    schema: listUserPostsSchema,
    preHandler: requireAuthentication
  }, userController.listMyPosts);

  // GET /api/v1/profile/:userId/posts - Listar posts de comunidad de un usuario
  fastify.get('/:userId/posts', {
    schema: {
      ...listUserPostsSchema,
      params: {
        type: 'object',
        properties: { userId: { type: 'integer' } },
        required: ['userId']
      }
    }
  }, userController.listUserPosts);

  // PUT /api/v1/profile/me/posts/:postId - Actualizar mi post de comunidad
  fastify.put('/me/posts/:postId', {
    preHandler: requireAuthentication,
    schema: {
      description: 'Actualizar un post de comunidad propio',
      tags: ['Profile'],
      params: {
        type: 'object',
        properties: { postId: { type: 'integer', minimum: 1 } },
        required: ['postId']
      },
      body: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 255 },
          descripcion: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            image_url: { type: 'string', nullable: true },
            image_urls: { type: 'array', items: { type: 'string' } },
            video_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, userController.updateMyComPost);

  // DELETE /api/v1/profile/me/posts/:postId - Eliminar mi post de comunidad
  fastify.delete('/me/posts/:postId', {
    preHandler: requireAuthentication,
    schema: {
      description: 'Eliminar un post de comunidad propio',
      tags: ['Profile'],
      params: {
        type: 'object',
        properties: { postId: { type: 'integer', minimum: 1 } },
        required: ['postId']
      },
      response: {
        200: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, userController.deleteMyComPost);

  // PUT /api/v1/profile/me/posts/:postId/media - Editar imágenes/video de mi post (multipart)
  fastify.put('/me/posts/:postId/media', {
    preHandler: requireAuthentication,
    schema: {
      description: 'Actualizar media (imágenes y/o video) de un post propio',
      tags: ['Profile'],
      consumes: ['multipart/form-data'],
      params: {
        type: 'object',
        properties: { postId: { type: 'integer', minimum: 1 } },
        required: ['postId']
      },
      body: {
        type: 'object',
        properties: {
          // Archivos opcionales
          video: { type: 'object' },
          image: {
            oneOf: [ { type: 'object' }, { type: 'array', items: { type: 'object' } } ]
          },
          // Campos para eliminar
          remove_video: { type: 'object' },
          remove_images: { type: 'object' } // puede ser CSV en .value
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            image_url: { type: 'string', nullable: true },
            image_urls: { type: 'array', items: { type: 'string' } },
            video_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    }
  }, userController.updateMyComPostMedia);
}

module.exports = profileRoutes; 