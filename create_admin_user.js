const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Script para crear un usuario administrador
 * Uso: node create_admin_user.js
 */
async function createAdminUser() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  };

  let pool;
  try {
    // Crear pool de conexión
    pool = mysql.createPool(config);
    
    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    connection.release();

    // Datos del administrador
    const adminData = {
      nombre: 'Administrador CdelU',
      email: 'admin@cdelu.ar',
      password: 'admin123', // Cambiar por una contraseña segura
      rol: 'administrador'
    };

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      [adminData.email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️ El usuario administrador ya existe');
      console.log(`Email: ${adminData.email}`);
      console.log(`ID: ${existingUsers[0].id}`);
      console.log('Para cambiar la contraseña, ejecuta el script de actualización');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Insertar el usuario administrador
    const [result] = await pool.query(
      `INSERT INTO users (nombre, email, password, rol) 
       VALUES (?, ?, ?, ?)`,
      [adminData.nombre, adminData.email, hashedPassword, adminData.rol]
    );

    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`ID: ${result.insertId}`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Contraseña: ${adminData.password}`);
    console.log('⚠️ IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('❌ La tabla users no existe. Ejecuta primero el script de creación de tablas.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Error de acceso a la base de datos. Verifica las credenciales.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al servidor MySQL. Verifica que esté ejecutándose.');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar el script
createAdminUser()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 