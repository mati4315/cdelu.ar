const { register, login } = require('../controllers/authController');

/**
 * Configura las rutas de autenticación
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function authRoutes(fastify, options) {
  // Registro de usuario
  fastify.post('/api/v1/auth/register', {
    schema: {
      tags: ['Autenticación'],
      summary: 'Registro de nuevo usuario',
      description: 'Crear una nueva cuenta de usuario en el sistema',
      body: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100,
            description: 'Nombre completo del usuario'
          },
          email: { 
            type: 'string', 
            format: 'email',
            description: 'Dirección de correo electrónico única'
          },
          password: { 
            type: 'string', 
            minLength: 6,
            maxLength: 100,
            description: 'Contraseña del usuario (mínimo 6 caracteres)'
          },
          rol: { 
            type: 'string', 
            enum: ['administrador', 'colaborador', 'usuario'],
            default: 'usuario',
            description: 'Rol del usuario en el sistema'
          }
        }
      },
      response: {
        201: {
          description: 'Usuario registrado exitosamente',
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' },
                rol: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' }
              }
            },
            token: { 
              type: 'string',
              description: 'Token JWT para autenticación'
            }
          }
        },
        400: {
          description: 'Datos de entrada inválidos',
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' }
          }
        },
        409: {
          description: 'El email ya está registrado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, register);

  // Login de usuario
  fastify.post('/api/v1/auth/login', {
    schema: {
      tags: ['Autenticación'],
      summary: 'Iniciar sesión',
      description: 'Autenticar usuario y obtener token JWT',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'Dirección de correo electrónico del usuario'
          },
          password: { 
            type: 'string', 
            minLength: 6,
            description: 'Contraseña del usuario'
          }
        }
      },
      response: {
        200: {
          description: 'Login exitoso',
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' },
                rol: { type: 'string' }
              }
            },
            token: { 
              type: 'string',
              description: 'Token JWT para autenticación'
            }
          }
        },
        400: {
          description: 'Datos de entrada inválidos',
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' }
          }
        },
        401: {
          description: 'Credenciales inválidas',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, login);

  // Obtener información del usuario actual
  fastify.get('/api/v1/auth/me', {
    onRequest: [require('../middlewares/auth').authenticate],
    schema: {
      tags: ['Autenticación'],
      summary: 'Obtener información del usuario actual',
      description: 'Obtener información del usuario autenticado',
      response: {
        200: {
          description: 'Información del usuario obtenida exitosamente',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' },
                rol: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: 'No autenticado',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // El usuario ya está disponible en request.user gracias al middleware authenticate
      reply.send({
        user: {
          id: request.user.id,
          nombre: request.user.nombre,
          email: request.user.email,
          rol: request.user.rol,
          created_at: request.user.created_at
        }
      });
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      reply.status(500).send({
        error: 'Error interno del servidor'
      });
    }
  });
}

module.exports = authRoutes; 