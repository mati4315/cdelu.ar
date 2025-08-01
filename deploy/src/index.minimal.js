const dotenv = require('dotenv');
const config = require('./config/default');
const { scheduleRSSImport } = require('./services/rssService');
const pool = require('./config/database');

// Cargar variables de entorno
dotenv.config();

// Usar la versión mínima de la app sin Swagger
const app = require('./app.minimal');

// Función para iniciar el servidor de forma resiliente
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor CdelU API (modo mínimo)...');
    
    // Intentar iniciar el servidor
    const address = await app.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });
    
    console.log(`✅ Servidor iniciado correctamente en ${address}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: ${address}/health`);
    console.log(`📈 Status: ${address}/api/v1/status`);
    
    // Programar importación RSS solo si está habilitado
    if (config.rss.enabled) {
      try {
        scheduleRSSImport(config.rss.intervalMinutes);
        console.log(`📰 Importación RSS programada (cada ${config.rss.intervalMinutes} minutos)`);
      } catch (rssError) {
        console.warn('⚠️ No se pudo programar la importación RSS:', rssError.message);
      }
    } else {
      console.log('📰 Importación RSS deshabilitada');
    }
    
    return app;
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    
    // Intentar modo de emergencia ultra-básico
    console.log('🆘 Intentando modo de emergencia...');
    
    try {
      const emergencyApp = require('fastify')({ logger: false });
      
      // Solo health check básico
      emergencyApp.get('/health', async (request, reply) => {
        return { 
          status: 'EMERGENCY_MODE',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          error: error.message
        };
      });
      
      const emergencyAddress = await emergencyApp.listen({ 
        port: config.port, 
        host: '0.0.0.0' 
      });
      
      console.log(`🆘 Servidor de emergencia iniciado en ${emergencyAddress}`);
      return emergencyApp;
      
    } catch (emergencyError) {
      console.error('💥 Error crítico - no se pudo iniciar ningún servidor:', emergencyError.message);
      process.exit(1);
    }
  }
}

// Manejo de señales del sistema
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  try {
    await app.close();
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar servidor:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  try {
    await app.close();
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar servidor:', error);
    process.exit(1);
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Error no capturado:', error.message);
  // No cerrar el proceso en modo producción para que Passenger pueda reiniciarlo
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  // No cerrar el proceso en modo producción
});

// Iniciar el servidor
if (require.main === module) {
  startServer().catch(error => {
    console.error('💥 Error fatal al iniciar:', error);
    process.exit(1);
  });
}

module.exports = { app, startServer }; 