"use strict";

const { authenticate } = require('../../middlewares/auth');
const ctrl = require('./users.controller');

/**
 * Rutas de usuarios y perfiles públicos (feature-based)
 * @param {import('fastify').FastifyInstance} fastify
 */
async function usersRoutes(fastify) {
  
  // GET /api/v1/users/profile/:username - Obtener perfil público
  fastify.get('/api/v1/users/profile/:username', {
    schema: {
      tags: ['Usuarios'],
      summary: 'Obtener perfil público de un usuario',
      description: 'Obtiene el perfil público de un usuario por su username. Si el usuario está autenticado, incluye información de seguimiento.',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { 
            type: 'string', 
            minLength: 3,
            maxLength: 50,
            description: 'Username del usuario' 
          }
        }
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
                nombre: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string', description: 'Solo visible para el propio usuario o admins' },
                profile_picture_url: { type: 'string', nullable: true },
                bio: { type: 'string', nullable: true },
                location: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' },
                is_verified: { type: 'boolean' },
                stats: {
                  type: 'object',
                  properties: {
                    followers_count: { type: 'integer' },
                    following_count: { type: 'integer' },
                    posts_count: { type: 'integer' }
                  }
                },
                is_following: { type: 'boolean', description: 'Solo si usuario está autenticado' },
                is_own_profile: { type: 'boolean', description: 'Solo si usuario está autenticado' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.getPublicProfile);

  // GET /api/v1/users/profile/:username/posts - Obtener posts de un usuario
  fastify.get('/api/v1/users/profile/:username/posts', {
    schema: {
      tags: ['Usuarios'],
      summary: 'Obtener posts públicos de un usuario',
      description: 'Obtiene la lista de posts de comunidad de un usuario específico con paginación.',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { 
            type: 'string', 
            minLength: 3,
            maxLength: 50,
            description: 'Username del usuario' 
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Página actual' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Número de posts por página' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Orden de los posts' }
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
                  titulo: { type: 'string' },
                  descripcion: { type: 'string' },
                  image_url: { type: 'string', nullable: true },
                  image_urls: { type: 'array', items: { type: 'string' } },
                  video_url: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  likes_count: { type: 'integer' },
                  comments_count: { type: 'integer' },
                  is_liked: { type: 'boolean', description: 'Solo si usuario está autenticado' },
                  autor: { type: 'string' },
                  user_id: { type: 'integer' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.getUserPosts);

  // POST /api/v1/users/:id/follow - Seguir a un usuario
  fastify.post('/api/v1/users/:id/follow', {
    onRequest: [authenticate],
    schema: {
      tags: ['Usuarios'],
      summary: 'Seguir a un usuario',
      description: 'Permite al usuario autenticado seguir a otro usuario.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del usuario a seguir' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                is_following: { type: 'boolean' },
                followers_count: { type: 'integer' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.followUser);

  // DELETE /api/v1/users/:id/follow - Dejar de seguir a un usuario
  fastify.delete('/api/v1/users/:id/follow', {
    onRequest: [authenticate],
    schema: {
      tags: ['Usuarios'],
      summary: 'Dejar de seguir a un usuario',
      description: 'Permite al usuario autenticado dejar de seguir a otro usuario.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1, description: 'ID del usuario a dejar de seguir' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                is_following: { type: 'boolean' },
                followers_count: { type: 'integer' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.unfollowUser);

  // GET /api/v1/users/profile/:username/followers - Obtener seguidores
  fastify.get('/api/v1/users/profile/:username/followers', {
    schema: {
      tags: ['Usuarios'],
      summary: 'Obtener lista de seguidores',
      description: 'Obtiene la lista de usuarios que siguen al usuario especificado.',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { 
            type: 'string', 
            minLength: 3,
            maxLength: 50,
            description: 'Username del usuario' 
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Página actual' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Número de seguidores por página' }
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
                  nombre: { type: 'string' },
                  username: { type: 'string' },
                  profile_picture_url: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
                  is_verified: { type: 'boolean' },
                  is_following: { type: 'boolean', description: 'Si el usuario actual sigue a este usuario' },
                  followed_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.getFollowers);

  // GET /api/v1/users/profile/:username/following - Obtener usuarios seguidos
  fastify.get('/api/v1/users/profile/:username/following', {
    schema: {
      tags: ['Usuarios'],
      summary: 'Obtener lista de usuarios que sigue',
      description: 'Obtiene la lista de usuarios que sigue el usuario especificado.',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { 
            type: 'string', 
            minLength: 3,
            maxLength: 50,
            description: 'Username del usuario' 
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Página actual' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Número de usuarios por página' }
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
                  nombre: { type: 'string' },
                  username: { type: 'string' },
                  profile_picture_url: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
                  is_verified: { type: 'boolean' },
                  is_following: { type: 'boolean', description: 'Si el usuario actual sigue a este usuario' },
                  followed_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.getFollowing);

  // GET /api/v1/users/search - Buscar usuarios
  fastify.get('/api/v1/users/search', {
    schema: {
      tags: ['Usuarios'],
      summary: 'Buscar usuarios por nombre o username',
      description: 'Busca usuarios por su nombre completo o username con paginación.',
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 2, description: 'Término de búsqueda (mínimo 2 caracteres)' },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Página actual' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Número de usuarios por página' }
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
                  nombre: { type: 'string' },
                  username: { type: 'string' },
                  profile_picture_url: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
                  followers_count: { type: 'integer' },
                  is_following: { type: 'boolean', description: 'Si el usuario actual sigue a este usuario' },
                  is_verified: { type: 'boolean' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ctrl.searchUsers);
}

module.exports = usersRoutes;
