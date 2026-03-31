const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

/**
 * Configuración de la conexión a MySQL
 * @type {Object}
 */
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * Crea un pool de conexiones a MySQL
 * @returns {Promise<mysql.Pool>}
 */
const createPool = async () => {
  try {
    const pool = mysql.createPool(dbConfig);
    
    // Verificar la conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    throw error;
  }
};

/**
 * Ejecuta una consulta SQL
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  const pool = await createPool();
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error en la consulta SQL:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

module.exports = {
  createPool,
  query
}; 