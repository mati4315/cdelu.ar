#!/usr/bin/env node

/**
 * Servidor de emergencia para cPanel
 * Versión mínima para diagnosticar problemas de conectividad
 */

console.log('🚨 INICIANDO SERVIDOR DE EMERGENCIA...');

const fastify = require('fastify')({ 
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV !== 'production'
  }
});

// Configuración básica de CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check básico
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'emergency',
    uptime: process.uptime()
  };
});

// Status detallado
fastify.get('/api/v1/status', async (request, reply) => {
  const memory = process.memoryUsage();
  
  return {
    status: 'EMERGENCY_MODE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
    },
    message: 'Servidor funcionando en modo de emergencia. Funcionalidad limitada.'
  };
});

// Test de base de datos
fastify.get('/api/v1/test-db', async (request, reply) => {
  try {
    require('dotenv').config();
    const mysql = require('mysql2/promise');
    
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario',
      connectTimeout: 5000
    };
    
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    
    return {
      database: 'connected',
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database
      }
    };
  } catch (error) {
    return {
      database: 'error',
      error: error.message,
      code: error.code
    };
  }
});

// Favicon
fastify.get('/favicon.ico', async (request, reply) => {
  return reply.code(204).send();
});

// Ruta raíz
fastify.get('/', async (request, reply) => {
  return {
    message: 'CdelU API - Servidor de Emergencia',
    status: 'running',
    endpoints: [
      '/health',
      '/api/v1/status',
      '/api/v1/test-db'
    ]
  };
});

// Manejador de errores simple
fastify.setErrorHandler((error, request, reply) => {
  console.error('Error:', error);
  
  reply.code(error.statusCode || 500).send({
    error: 'Error en servidor de emergencia',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`✅ Servidor de emergencia iniciado en puerto ${port}`);
    console.log(`🌐 Endpoints disponibles:`);
    console.log(`   - http://localhost:${port}/health`);
    console.log(`   - http://localhost:${port}/api/v1/status`);
    console.log(`   - http://localhost:${port}/api/v1/test-db`);
    
  } catch (err) {
    console.error('❌ Error al iniciar servidor de emergencia:', err);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor de emergencia...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor de emergencia...');
  await fastify.close();
  process.exit(0);
});

start(); 