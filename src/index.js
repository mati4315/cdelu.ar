const app = require('./app');
const dotenv = require('dotenv');
const config = require('./config/default');
const { scheduleRSSImport } = require('./services/rssService');
const pool = require('./config/database');

// Cargar variables de entorno
dotenv.config();

let serverAddress;
let dbConnected = false;

// Manejar errores de WebAssembly específicamente
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
  
  // Filtrar errores de WebAssembly que son esperados
  if (err.message && (err.message.includes('WebAssembly') || err.message.includes('Wasm memory'))) {
    console.log('💡 Error de WebAssembly ignorado (esperado en hosting compartido)');
    return;
  }
  
  // Solo salir si es un error crítico
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  
  // Filtrar errores de WebAssembly/undici que son esperados
  if (reason && reason.message && 
      (reason.message.includes('WebAssembly') || 
       reason.message.includes('undici') ||
       reason.message.includes('Wasm memory') ||
       reason.message.includes('lazyllhttp'))) {
    console.log('💡 Error de WebAssembly/undici ignorado (esperado en hosting compartido)');
    return;
  }
});

// Función para verificar la conexión a la base de datos
async function checkDatabaseConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    if (connection) {
      console.log('✅ Conexión a la base de datos verificada');
      dbConnected = true;
      return true;
    }
  } catch (err) {
    console.error('❌ Error al verificar conexión a la base de datos:', err.message);
    dbConnected = false;
    return false;
  } finally {
    if (connection) connection.release();
  }
  return false;
}

// Programar verificación periódica de la base de datos
function scheduleDbCheck() {
  setInterval(async () => {
    try {
      const isConnected = await checkDatabaseConnection();
      if (!isConnected && serverAddress) {
        console.log('🔄 Intentando reconectar a la base de datos...');
      }
    } catch (err) {
      console.error('Error en la verificación periódica de la BD:', err);
    }
  }, 5 * 60 * 1000); // Verificar cada 5 minutos
}

const start = async () => {
  let retries = 5;
  
  while (retries > 0) {
    try {
      // Verificar conexión a la base de datos antes de iniciar
      const dbConnected = await checkDatabaseConnection();
      
      if (!dbConnected) {
        console.log(`⚠️ Problemas con la base de datos. Reintentando... (${retries} intentos restantes)`);
        retries--;
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
          continue;
        } else {
          console.log('⚠️ Iniciando sin confirmación de la base de datos. La aplicación funcionará con funcionalidad limitada.');
        }
      }
      
      // Cerrar la aplicación si ya existe
      if (serverAddress) {
        try {
          await app.close();
          console.log('🔄 Servidor anterior cerrado');
        } catch (closeError) {
          console.log('⚠️ Error al cerrar servidor anterior:', closeError.message);
        }
      }

      // Iniciar el servidor
      serverAddress = await app.listen({ 
        port: config.port,
        host: '0.0.0.0'  // Escuchar en todas las interfaces
      });
      
      console.log(`✨ Servidor corriendo en puerto: ${config.port}`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de datos: ${dbConnected ? 'Conectada' : 'Desconectada'}`);
      
      // Programar verificación periódica de la base de datos
      scheduleDbCheck();

      // Iniciar importación automática de RSS solo si está habilitado y la BD está conectada
      if (process.env.RSS_ENABLED !== 'false' && dbConnected) {
        scheduleRSSImport(60); // Importar cada 60 minutos
        console.log('📰 Importación automática de RSS iniciada');
      } else {
        console.log('📰 Importación automática de RSS deshabilitada');
      }
      
      // Salir del bucle de reintentos
      break;
    } catch (err) {
      app.log.error(err);
      
      retries--;
      if (retries <= 0) {
        console.error('❌ No se pudo iniciar el servidor después de múltiples intentos.');
        console.error('Error:', err.message);
        
        // En lugar de salir, intentar iniciar con configuración mínima
        try {
          serverAddress = await app.listen({ 
            port: config.port,
            host: '0.0.0.0'
          });
          console.log('🚨 Servidor iniciado en modo de emergencia');
          break;
        } catch (emergencyErr) {
          console.error('❌ Fallo crítico al iniciar servidor:', emergencyErr.message);
          process.exit(1);
        }
      }
      
      console.log(`Reintentando en 3 segundos... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
    }
  }
};

// Manejar señales de terminación
process.on('SIGTERM', async () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  if (serverAddress) {
    try {
      await app.close();
      console.log('👋 Servidor cerrado correctamente.');
    } catch (closeError) {
      console.log('⚠️ Error al cerrar servidor:', closeError.message);
    }
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
  if (serverAddress) {
    try {
      await app.close();
      console.log('👋 Servidor cerrado correctamente.');
    } catch (closeError) {
      console.log('⚠️ Error al cerrar servidor:', closeError.message);
    }
    process.exit(0);
  }
});

start(); 