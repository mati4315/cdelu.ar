#!/usr/bin/env node

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabaseAndAdmin() {
  console.log('🔧 Configurando base de datos y usuario administrador...');
  
  // Configuración de la base de datos (sin especificar database para poder crearla)
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  let connection;
  
  try {
    // Conectar a MySQL sin especificar base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    // Crear la base de datos si no existe
    await connection.execute(`CREATE DATABASE IF NOT EXISTS cdelu_diario`);
    console.log('✅ Base de datos cdelu_diario creada/verificada');

    // Usar la base de datos
    await connection.execute(`USE cdelu_diario`);

    // Crear tabla de roles
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('✅ Tabla roles creada/verificada');

    // Crear tabla de usuarios
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
    console.log('✅ Tabla users creada/verificada');

    // Insertar roles
    await connection.execute(`
      INSERT IGNORE INTO roles (nombre) VALUES 
      ('administrador'),
      ('colaborador'),
      ('usuario')
    `);
    console.log('✅ Roles insertados');

    // Generar hash de la contraseña
    const password = 'w35115415';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Hash de contraseña generado');

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

    // Verificar que el usuario se creó correctamente
    const [users] = await connection.execute(`
      SELECT u.id, u.nombre, u.email, r.nombre as rol
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, ['matias4315@gmail.com']);

    if (users.length > 0) {
      console.log('✅ Verificación exitosa - Usuario encontrado en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Verifica que:');
    console.error('   - MySQL esté corriendo');
    console.error('   - Las credenciales en .env sean correctas');
    console.error('   - El usuario MySQL tenga permisos para crear bases de datos');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
setupDatabaseAndAdmin(); 