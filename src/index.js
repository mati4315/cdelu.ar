const app = require('./app');
const dotenv = require('dotenv');
const config = require('./config/default');
const { scheduleRSSImport } = require('./services/rssService');

// Cargar variables de entorno
dotenv.config();

let server;

const start = async () => {
  try {
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

    // Iniciar importación automática de RSS
    scheduleRSSImport(60); // Importar cada 60 minutos
    console.log('📰 Importación automática de RSS iniciada');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', async () => {
  if (server) {
    await server.close();
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  if (server) {
    await server.close();
    process.exit(0);
  }
});

start(); 