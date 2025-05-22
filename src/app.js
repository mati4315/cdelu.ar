const fastify = require('fastify')({ logger: true });
const path = require('path');
const config = require('./config/default');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const { authenticate, authorize } = require('./middlewares/auth');

// Registrar plugins
fastify.register(require('@fastify/cors'), {
  origin: config.corsOrigin
});
fastify.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.corsOrigin],
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

// Ruta de health check - DEBE estar antes del hook onRequest
fastify.get('/health', async (request, reply) => {
  return { status: 'OK' };
});

// Ruta para favicon (evita 404 en logs) - DEBE estar antes del hook onRequest
fastify.get('/favicon.ico', async (request, reply) => {
  return reply.code(204).send();
});

// Registrar rutas
fastify.register(authRoutes);
fastify.register(newsRoutes);
fastify.register(userRoutes);
fastify.register(statsRoutes);

fastify.addHook('onRequest', async (request, reply) => {
    // Excluir rutas públicas (login, register, health) de la autenticación
    if (
        request.url.startsWith('/api/v1/auth/') ||
        request.url === '/health' ||
        request.url.startsWith('/public/') ||
        request.url === '/favicon.ico'
    ) {
        return;
    }
    
    // Aplicar autenticación a las demás rutas
    try {
        await request.jwtVerify();
        request.user = request.user; // Asegurarse de que request.user esté poblado
    } catch (err) {
        reply.code(401).send({ error: 'No autorizado o token inválido' });
    }
});

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

// Manejador de errores global
fastify.setErrorHandler((error, request, reply) => {
  // Registrar el error con todos los detalles
  request.log.error({
    error: error,
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    params: request.params,
    query: request.query,
    headers: request.headers
  });
  
  // Error de validación
  if (error.validation) {
    return reply
      .code(400)
      .send({ error: 'Error de validación', details: error.validation });
  }

  // Error de JWT
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply
      .code(401)
      .send({ error: 'No autorizado. Por favor inicie sesión nuevamente.' });
  }

  // Error de base de datos
  if (error.code && error.code.startsWith('ER_')) {
    return reply
      .code(500)
      .send({ 
        error: 'Error de base de datos', 
        message: 'Ocurrió un problema con la conexión a la base de datos.',
        code: error.code
      });
  }

  // Error de conexión a base de datos
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return reply
      .code(503)
      .send({ 
        error: 'Base de datos no disponible', 
        message: 'No se pudo conectar a la base de datos. Por favor intente más tarde.' 
      });
  }

  // Error genérico pero con información de diagnóstico
  const statusCode = error.statusCode || 500;
  
  reply
    .code(statusCode)
    .send({ 
      error: 'Error en el servidor', 
      message: process.env.NODE_ENV === 'production' 
        ? 'Ha ocurrido un error interno. Por favor intente más tarde.' 
        : error.message
    });
});

module.exports = fastify; 