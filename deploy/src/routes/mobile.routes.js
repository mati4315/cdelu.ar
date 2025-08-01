const { authenticate } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

/**
 * Rutas específicas para apps móviles
 * Optimizadas para consumo desde Android/iOS
 */
async function mobileRoutes(fastify, options) {
  
  // Endpoint de configuración para apps móviles
  fastify.get('/api/v1/mobile/config', {
    schema: {
      tags: ['Móvil'],
      summary: 'Configuración para apps móviles',
      description: 'Endpoint que devuelve configuración específica para apps móviles',
      response: {
        200: {
          description: 'Configuración de la app móvil',
          type: 'object',
          properties: {
            api_version: { type: 'string' },
            server_url: { type: 'string' },
            features: {
              type: 'object',
              properties: {
                feed_enabled: { type: 'boolean' },
                auth_enabled: { type: 'boolean' },
                upload_enabled: { type: 'boolean' },
                comments_enabled: { type: 'boolean' },
                likes_enabled: { type: 'boolean' }
              }
            },
            limits: {
              type: 'object',
              properties: {
                max_image_size: { type: 'number' },
                max_video_size: { type: 'number' },
                max_upload_files: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      api_version: '1.0.0',
      server_url: process.env.NODE_ENV === 'production' 
        ? 'https://diario.trigamer.xyz' 
        : 'http://localhost:3001',
      features: {
        feed_enabled: true,
        auth_enabled: true,
        upload_enabled: true,
        comments_enabled: true,
        likes_enabled: true
      },
      limits: {
        max_image_size: 10 * 1024 * 1024, // 10MB
        max_video_size: 200 * 1024 * 1024, // 200MB
        max_upload_files: 6
      }
    };
  });

  // Endpoint de health check específico para móviles
  fastify.get('/api/v1/mobile/health', {
    schema: {
      tags: ['Móvil'],
      summary: 'Health check para apps móviles',
      description: 'Endpoint optimizado para verificar conectividad desde apps móviles',
      response: {
        200: {
          description: 'Estado del servidor',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            server_time: { type: 'string' },
            timezone: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      server_time: new Date().toLocaleString('es-AR', { 
        timeZone: 'America/Argentina/Buenos_Aires' 
      }),
      timezone: 'America/Argentina/Buenos_Aires'
    };
  });

  // Endpoint de feed optimizado para móviles
  fastify.get('/api/v1/mobile/feed', {
    schema: {
      tags: ['Móvil'],
      summary: 'Feed optimizado para apps móviles',
      description: 'Endpoint del feed con datos optimizados para consumo móvil',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          type: { type: 'integer', enum: [1, 2] }, // 1=noticias, 2=comunidad
          sort: { type: 'string', default: 'published_at' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Feed de contenido',
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
                  image_url: { type: 'string' },
                  type: { type: 'integer' },
                  user_name: { type: 'string' },
                  created_at: { type: 'string' },
                  likes_count: { type: 'integer' },
                  comments_count: { type: 'integer' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { page = 1, limit = 10, type, sort = 'published_at', order = 'desc' } = request.query;
    
    const pool = require('../config/database');
    const offset = (page - 1) * limit;
    
    try {
      let whereClause = '';
      let params = [];
      
      if (type) {
        whereClause = 'WHERE type = ?';
        params.push(type);
      }
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM content_feed 
        ${whereClause}
      `;
      
      const dataQuery = `
        SELECT 
          id, titulo, descripcion, image_url, type,
          user_name, created_at, likes_count, comments_count
        FROM content_feed 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const [countResult] = await pool.execute(countQuery, type ? [type] : []);
      const [dataResult] = await pool.execute(dataQuery, params);
      
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: dataResult,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
      
    } catch (error) {
      fastify.log.error('Error en mobile feed:', error);
      reply.code(500).send({ 
        error: 'Error interno del servidor',
        message: error.message 
      });
    }
  });

  // Endpoint de login optimizado para móviles
  fastify.post('/api/v1/mobile/login', {
    schema: {
      tags: ['Móvil'],
      summary: 'Login optimizado para apps móviles',
      description: 'Endpoint de login con respuesta optimizada para apps móviles',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          description: 'Login exitoso',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            },
            expires_in: { type: 'string' }
          }
        },
        401: {
          description: 'Credenciales inválidas',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      // Respuesta de prueba para verificar que funciona
      return {
        success: true,
        token: 'test_token_123',
        user: {
          id: 1,
          name: 'Test User',
          email: email,
          role: 'usuario'
        },
        expires_in: '24h'
      };
      
    } catch (error) {
      fastify.log.error('Error en mobile login:', error);
      reply.code(500).send({ 
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  });
}

module.exports = mobileRoutes; 