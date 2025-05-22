const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cdelu_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 segundos
  connectTimeout: 10000, // 10 segundos
  // Reintento de conexión
  acquireTimeout: 10000, // 10 segundos
  // Manejo de desconexiones
  dateStrings: true, // Manejar fechas como strings
  // Opciones de seguridad
  supportBigNumbers: true,
  bigNumberStrings: true
};

// Crear el pool de conexiones
const pool = mysql.createPool(config);

// Verificar la conexión de base de datos
async function testConnection() {
  let testConnection;
  try {
    testConnection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    console.error('Configuración de conexión (sin contraseña):', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database
    });
    return false;
  } finally {
    if (testConnection) {
      testConnection.release();
    }
  }
}

// Ejecutar prueba de conexión
testConnection()
  .then(success => {
    if (!success) {
      console.error('⚠️ La aplicación podría no funcionar correctamente debido a problemas de conexión con la base de datos');
    }
  })
  .catch(err => {
    console.error('Error inesperado al probar la conexión:', err);
  });

module.exports = pool; 