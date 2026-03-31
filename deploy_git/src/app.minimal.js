const fastify = require('fastify')({ logger: true });
const path = require('path');
const config = require('./config/default');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const comRoutes = require('./routes/com.routes.js');
const docsRoutes = require('./routes/docs.routes.js');
const { authenticate, authorize } = require('./middlewares/auth');

// Registrar plugins básicos
fastify.register(require('@fastify/cors'), {
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'X-API-Version',
    'X-Response-Time',
    'X-Total-Count'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
});

// Registrar plugin JWT
fastify.register(require('@fastify/jwt'), {
  secret: config.jwt.secret,
  sign: {
    expiresIn: config.jwt.expiresIn
  }
});

// Registrar plugin para servir archivos estáticos
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/public/',
  decorateReply: false,
  index: false,
  list: false
});

// Registrar fastify/multipart para subida de archivos
fastify.register(require('@fastify/multipart'), {
  attachFieldsToBody: true,
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024 * 1,
    fields: 10,
    fileSize: 1024 * 1024 * 200,
    files: 7,
    headerPairs: 2000
  }
});

// Ruta de health check - DEBE estar antes del hook onRequest
fastify.get('/health', {
  schema: {
    tags: ['Sistema'],
    summary: 'Health Check del servidor',
    description: 'Endpoint para verificar que el servidor está funcionando correctamente',
    response: {
      200: {
        description: 'Servidor funcionando correctamente',
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', description: 'Tiempo de actividad en segundos' },
          environment: { type: 'string', description: 'Entorno de ejecución' }
        }
      }
    }
  }
}, async (request, reply) => {
  return { 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };
});

// Ruta para favicon (evita 404 en logs)
fastify.get('/favicon.ico', async (request, reply) => {
  return reply.code(204).send();
});

// Ruta para robots.txt
fastify.get('/robots.txt', async (request, reply) => {
  reply.type('text/plain');
  return `User-agent: *
Disallow: /api/
Allow: /public/`;
});

// Ruta de diagnóstico para cPanel
fastify.get('/api/v1/status', {
  schema: {
    tags: ['Sistema'],
    summary: 'Estado detallado del sistema',
    description: 'Endpoint para diagnosticar problemas en cPanel',
    response: {
      200: {
        description: 'Estado del sistema',
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          environment: { type: 'string' },
          database: { type: 'object' },
          memory: { type: 'object' }
        }
      }
    }
  }
}, async (request, reply) => {
  const pool = require('./config/database');
  let dbStatus = 'disconnected';
  let dbError = null;
  
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    dbStatus = 'connected';
  } catch (error) {
    dbError = error.message;
  }
  
  const memory = process.memoryUsage();
  
  return { 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      error: dbError
    },
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
    }
  };
});

// Registrar rutas
fastify.register(authRoutes);
fastify.register(newsRoutes);
fastify.register(userRoutes);
fastify.register(statsRoutes);
fastify.register(comRoutes);
fastify.register(docsRoutes);

// Ruta específica para el dashboard
fastify.get('/dashboard', async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

// Ruta para la raíz que redirija al dashboard
fastify.get('/', async (request, reply) => {
  return reply.redirect('/public/dashboard.html');
});

// Hook de autenticación mejorado
fastify.addHook('onRequest', async (request, reply) => {
    const publicRoutes = [
        '/api/v1/auth/',
        '/health',
        '/public/',
        '/favicon.ico'
    ];
    
    const isPublicRoute = publicRoutes.some(route => 
        request.url.startsWith(route)
    );
    
    const isPublicNewsRoute = request.method === 'GET' && 
        request.url.startsWith('/api/v1/news');
    
    if (isPublicRoute || isPublicNewsRoute) {
        return;
    }
    
    try {
        await request.jwtVerify();
        request.user = request.user;
    } catch (err) {
        reply.code(401).send({ 
            error: 'No autorizado',
            message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.',
            code: 'UNAUTHORIZED'
        });
    }
});

// Manejador de errores global mejorado
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({
    error: error,
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });
  
  if (error.validation) {
    return reply
      .code(400)
      .send({ 
        error: 'Error de validación', 
        message: 'Los datos enviados no cumplen con el formato requerido',
        details: error.validation,
        code: 'VALIDATION_ERROR'
      });
  }

  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply
      .code(401)
      .send({ 
        error: 'No autorizado', 
        message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.',
        code: 'JWT_ERROR'
      });
  }

  if (error.code && error.code.startsWith('ER_')) {
    return reply
      .code(500)
      .send({ 
        error: 'Error de base de datos', 
        message: 'Ocurrió un problema con la conexión a la base de datos.',
        code: error.code
      });
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return reply
      .code(503)
      .send({ 
        error: 'Base de datos no disponible', 
        message: 'No se pudo conectar a la base de datos. Por favor intente más tarde.',
        code: 'DATABASE_UNAVAILABLE'
      });
  }

  if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply
      .code(413)
      .send({
        error: 'Archivo demasiado grande',
        message: 'El archivo excede el tamaño máximo permitido (200MB).',
        code: 'FILE_TOO_LARGE'
      });
  }

  if (error.statusCode === 429) {
    return reply
      .code(429)
      .send({
        error: 'Demasiadas solicitudes',
        message: 'Ha excedido el límite de solicitudes. Intente nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
  }

  const statusCode = error.statusCode || 500;
  
  reply
    .code(statusCode)
    .send({ 
      error: 'Error en el servidor', 
      message: process.env.NODE_ENV === 'production' 
        ? 'Ha ocurrido un error interno. Por favor intente más tarde.' 
        : error.message,
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
});

// Hook para añadir headers de respuesta
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-API-Version', '1.0.0');
  const responseTime = Date.now() - request.startTime;
  reply.header('X-Response-Time', `${responseTime}ms`);
  return payload;
});

// Hook para medir tiempo de respuesta
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

module.exports = fastify; 