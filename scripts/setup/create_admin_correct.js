#!/usr/bin/env node

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUserCorrect() {
  console.log('🔧 Creando usuario administrador con estructura correcta...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cdelu_diario'
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Generar hash de la contraseña
    const password = 'w35115415';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Hash de contraseña generado');

    // Insertar usuario administrador con la estructura correcta
    const [result] = await connection.execute(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (?, ?, ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role = VALUES(role),
        is_active = VALUES(is_active)
    `, ['Matias Moreira', 'matias4315@gmail.com', hashedPassword]);

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email: matias4315@gmail.com');
    console.log('🔑 Contraseña: w35115415');
    console.log('👤 Rol: admin');

    // Verificar que el usuario se creó correctamente
    const [users] = await connection.execute(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      WHERE email = ?
    `, ['matias4315@gmail.com']);

    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Verificación exitosa:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${user.created_at}`);
    }

    // Mostrar todos los usuarios
    const [allUsers] = await connection.execute(`
      SELECT id, name, email, role, is_active
      FROM users
      ORDER BY id
    `);

    console.log('');
    console.log('📋 Todos los usuarios en la base de datos:');
    allUsers.forEach(user => {
      console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.role} - ${user.is_active ? 'Activo' : 'Inactivo'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
createAdminUserCorrect(); 