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
      body: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { 
            type: 'string', 
            enum: ['administrador', 'colaborador', 'usuario'],
            default: 'usuario'
          }
        }
      }
    }
  }, register);

  // Login de usuario
  fastify.post('/api/v1/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, login);
}

module.exports = authRoutes; 