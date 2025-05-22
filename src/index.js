const app = require('./app');
const dotenv = require('dotenv');
const config = require('./config/default');
const { scheduleRSSImport } = require('./services/rssService');
const pool = require('./config/database');

// Cargar variables de entorno
dotenv.config();

let server;
let dbConnected = false;

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
      if (!isConnected && server) {
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
          console.log('⚠️ Iniciando sin confirmación de la base de datos. La aplicación podría no funcionar correctamente.');
        }
      }
      
      // Cerrar el servidor si ya existe
      if (server) {
        await server.close();
      }

      // Iniciar el servidor
      server = await app.listen({ 
        port: config.port,
        host: '0.0.0.0'  // Escuchar en todas las interfaces
      });
      
      console.log(`✨ Servidor corriendo en: ${config.port}`);
      
      // Programar verificación periódica de la base de datos
      scheduleDbCheck();

      // Iniciar importación automática de RSS solo si está habilitado
      if (process.env.RSS_ENABLED !== 'false') {
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
        process.exit(1);
      }
      
      console.log(`Reintentando en 3 segundos... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
    }
  }
};

// Manejar señales de terminación
process.on('SIGTERM', async () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  if (server) {
    await server.close();
    console.log('👋 Servidor cerrado correctamente.');
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
  if (server) {
    await server.close();
    console.log('👋 Servidor cerrado correctamente.');
    process.exit(0);
  }
});

start(); 