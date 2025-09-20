/**
 * Middleware de Rate Limiting para Fastify
 * Protege contra ataques de fuerza bruta y spam
 * 
 * NOTA: DESACTIVADO TEMPORALMENTE PARA DESARROLLO
 */

const rateLimit = require('@fastify/rate-limit');

/**
 * Configuración de rate limiting por tipo de endpoint
 */
const rateLimitConfig = {
  // Rate limiting general para todas las rutas
  global: {
    max: 10000, // Aumentado drásticamente para desarrollo
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: {
      error: 'Demasiadas requests',
      message: 'Has excedido el límite de requests. Intenta más tarde.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (request) => {
      // Usar IP del cliente como clave
      return request.ip;
    },
    skip: (request) => {
      // Saltar rate limiting para TODAS las rutas en desarrollo
      return true; // DESACTIVADO TEMPORALMENTE
      
      // Configuración original (comentada):
      /*
      const publicRoutes = [
        '/health',
        '/api/v1/health',
        '/favicon.ico',
        '/dashboard.html',
        '/login.html',
        '/public/'
      ];
      return publicRoutes.some(route => request.url.startsWith(route));
      */
    }
  },

  // Rate limiting específico para autenticación
  auth: {
    max: 1000, // Aumentado drásticamente para desarrollo
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: {
      error: 'Demasiados intentos de login',
      message: 'Has excedido el límite de intentos de login. Intenta más tarde.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (request) => {
      // Usar IP + User-Agent para mayor seguridad
      const userAgent = request.headers['user-agent'] || 'unknown';
      return `${request.ip}-${userAgent}`;
    },
    skip: (request) => {
      // Saltar rate limiting para autenticación en desarrollo
      return true; // DESACTIVADO TEMPORALMENTE
      
      // Configuración original (comentada):
      // return !request.url.startsWith('/api/v1/auth');
    }
  },

  // Rate limiting para creación de contenido
  content: {
    max: 1000, // Aumentado drásticamente para desarrollo
    windowMs: 60 * 60 * 1000, // 1 hora
    message: {
      error: 'Demasiadas publicaciones',
      message: 'Has excedido el límite de publicaciones. Intenta más tarde.',
      code: 'CONTENT_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (request) => {
      // Usar ID del usuario si está autenticado, sino IP
      return request.user ? request.user.id : request.ip;
    },
    skip: (request) => {
      // Saltar rate limiting para contenido en desarrollo
      return true; // DESACTIVADO TEMPORALMENTE
      
      // Configuración original (comentada):
      /*
      const contentRoutes = [
        '/api/v1/news',
        '/api/v1/com',
        '/api/v1/ads'
      ];
      return !contentRoutes.some(route => request.url.startsWith(route));
      */
    }
  },

  // Rate limiting para API de anuncios
  ads: {
    max: 10000, // Aumentado drásticamente para desarrollo
    windowMs: 5 * 60 * 1000, // 5 minutos
    message: {
      error: 'Demasiadas requests de anuncios',
      message: 'Has excedido el límite de requests de anuncios.',
      code: 'ADS_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (request) => {
      return request.ip;
    },
    skip: (request) => {
      // Saltar rate limiting para anuncios en desarrollo
      return true; // DESACTIVADO TEMPORALMENTE
      
      // Configuración original (comentada):
      // return !request.url.startsWith('/api/v1/ads');
    }
  }
};

/**
 * Registrar rate limiting en Fastify
 */
function registerRateLimit(fastify) {
  console.log('⚠️  RATE LIMITING DESACTIVADO PARA DESARROLLO');
  console.log('🔒 Para activar en producción, cambiar skip: true por skip: false');
  
  // Rate limiting global
  fastify.register(rateLimit, rateLimitConfig.global);

  // Rate limiting específico para autenticación
  fastify.register(rateLimit, {
    ...rateLimitConfig.auth,
    prefix: '/api/v1/auth'
  });

  // Rate limiting para contenido
  fastify.register(rateLimit, {
    ...rateLimitConfig.content,
    prefix: '/api/v1'
  });

  // Rate limiting para anuncios
  fastify.register(rateLimit, {
    ...rateLimitConfig.ads,
    prefix: '/api/v1/ads'
  });

  // Middleware personalizado para logging de rate limiting
  fastify.addHook('onRequest', async (request, reply) => {
    // Log de requests que podrían ser sospechosas
    const suspiciousPatterns = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/ads/click'
    ];

    if (suspiciousPatterns.some(pattern => request.url.includes(pattern))) {
      fastify.log.info({
        msg: 'Request potencialmente sospechosa',
        ip: request.ip,
        url: request.url,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
    }
  });

  // Hook para manejar errores de rate limiting
  fastify.setErrorHandler((error, request, reply) => {
    if (error.statusCode === 429) {
      fastify.log.warn({
        msg: 'Rate limit excedido',
        ip: request.ip,
        url: request.url,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      const retrySeconds = Number(error.retryAfter || 900);
      reply.header('Retry-After', retrySeconds.toString());
      return reply.status(429).send({
        error: 'Demasiadas solicitudes',
        message: 'Ha excedido el límite de solicitudes. Intente nuevamente más tarde.',
        retryAfter: retrySeconds,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Pasar otros errores al handler por defecto
    reply.send(error);
  });
}

module.exports = {
  registerRateLimit,
  rateLimitConfig
}; 