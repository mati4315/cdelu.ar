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
              updated_at: { type: 'string', format: 'date-time' }
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

}

module.exports = profileRoutes; 