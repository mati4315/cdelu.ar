const fastify = require('fastify')({ logger: true });
const path = require('path');
const config = require('./config/default');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const { authenticate, authorize } = require('./middlewares/auth');

// Registrar plugins
fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3001"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
});
fastify.register(require('@fastify/jwt'), {
  secret: config.jwt.secret,
  sign: {
    expiresIn: config.jwt.expiresIn
  }
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});
fastify.register(require('@fastify/swagger'), {
  routePrefix: '/documentation',
  exposeRoute: true,
  swagger: {
    info: {
      title: 'CdelU API',
      description: 'API para el diario online CdelU',
      version: '1.0.0'
    },
    host: `localhost:${config.port}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

// Registrar rutas
fastify.register(authRoutes);
fastify.register(newsRoutes);
fastify.register(userRoutes);
fastify.register(statsRoutes);

// Ruta protegida para el dashboard
fastify.get('/dashboard', {
  onRequest: [authenticate, authorize(['administrador'])]
}, async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

// Ruta alternativa para el dashboard.html
fastify.get('/dashboard.html', {
  onRequest: [authenticate, authorize(['administrador'])]
}, async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

// Ruta de health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK' };
});

// Manejador de errores global
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  
  // Error de validación
  if (error.validation) {
    return reply
      .code(400)
      .send({ error: 'Error de validación', details: error.validation });
  }

  // Error de base de datos
  if (error.code && error.code.startsWith('ER_')) {
    return reply
      .code(500)
      .send({ error: 'Error de base de datos' });
  }

  // Error genérico
  reply
    .code(500)
    .send({ error: 'Error interno del servidor' });
});

module.exports = fastify; 