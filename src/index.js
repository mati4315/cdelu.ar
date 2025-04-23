const app = require('./app');
const dotenv = require('dotenv');
const config = require('./config/default');
const { scheduleRSSImport } = require('./services/rssService');

// Cargar variables de entorno
dotenv.config();

const start = async () => {
  try {
    await app.listen({ port: config.port });
    console.log(`✨ Servidor corriendo en: ${app.server.address().port}`);

    // Iniciar importación automática de RSS
    scheduleRSSImport(60); // Importar cada 60 minutos
    console.log('📰 Importación automática de RSS iniciada');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 