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
          role: { 
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
                role: { type: 'string' },
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
                role: { type: 'string' }
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
}

module.exports = authRoutes; 