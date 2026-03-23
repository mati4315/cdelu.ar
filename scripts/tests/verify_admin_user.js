#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyAdminUser() {
  console.log('🔍 Verificando usuario administrador...');
  
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

    // Verificar que el usuario existe
    const [users] = await connection.execute(`
      SELECT u.id, u.nombre, u.email, r.nombre as rol, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, ['matias4315@gmail.com']);

    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Usuario administrador encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log('');
      console.log('🎉 ¡El usuario administrador está listo para usar!');
      console.log('📧 Email: matias4315@gmail.com');
      console.log('🔑 Contraseña: w35115415');
    } else {
      console.log('❌ Usuario administrador no encontrado');
    }

    // Mostrar todos los usuarios
    const [allUsers] = await connection.execute(`
      SELECT u.id, u.nombre, u.email, r.nombre as rol
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);

    console.log('');
    console.log('📋 Todos los usuarios en la base de datos:');
    allUsers.forEach(user => {
      console.log(`   ${user.id}. ${user.nombre} (${user.email}) - ${user.rol}`);
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
verifyAdminUser(); 