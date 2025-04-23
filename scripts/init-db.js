const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Inicializa la base de datos y crea las tablas necesarias
 */
async function initDatabase() {
  let connection;
  try {
    // Conectar a MySQL sin especificar la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Conectado a MySQL');

    // Crear la base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Base de datos ${process.env.DB_NAME} creada o ya existente`);

    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Leer y ejecutar cada comando SQL del schema
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../sql/schema.sql'), 'utf8');
    const commands = schemaSql.split(';').filter(cmd => cmd.trim());
    
    for (const cmd of commands) {
      if (cmd.trim()) {
        await connection.query(cmd);
      }
    }
    console.log('✅ Tablas creadas correctamente');

    // Leer y ejecutar cada comando SQL del seed
    const seedSql = fs.readFileSync(path.resolve(__dirname, '../sql/seed.sql'), 'utf8');
    const seedCommands = seedSql.split(';').filter(cmd => cmd.trim());
    
    for (const cmd of seedCommands) {
      if (cmd.trim()) {
        await connection.query(cmd);
      }
    }
    console.log('✅ Datos iniciales insertados');

    console.log('✨ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la inicialización
initDatabase().catch(console.error); 