#!/usr/bin/env node

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAdminUser() {
  console.log('🔧 Agregando usuario administrador...');
  
  // Configuración de la base de datos
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cdelu_diario'
  };

  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Crear tablas si no existen
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // Insertar roles
    await connection.execute(`
      INSERT IGNORE INTO roles (nombre) VALUES 
      ('administrador'),
      ('colaborador'),
      ('usuario')
    `);

    // Generar hash de la contraseña
    const password = 'w35115415';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario administrador
    const [result] = await connection.execute(`
      INSERT INTO users (nombre, email, password, role_id)
      VALUES (?, ?, ?, (SELECT id FROM roles WHERE nombre = 'administrador'))
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role_id = VALUES(role_id)
    `, ['Matias Moreira', 'matias4315@gmail.com', hashedPassword]);

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email: matias4315@gmail.com');
    console.log('🔑 Contraseña: w35115415');
    console.log('👤 Rol: Administrador');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Verifica que:');
    console.error('   - MySQL esté corriendo');
    console.error('   - Las credenciales en .env sean correctas');
    console.error('   - La base de datos exista');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
addAdminUser(); 