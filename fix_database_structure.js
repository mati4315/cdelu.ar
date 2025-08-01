const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixDatabaseStructure() {
  console.log('🔧 Corrigiendo estructura de la base de datos...');
  
  // Configuración de conexión (sin especificar database para poder crearla)
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // XAMPP por defecto no tiene contraseña
    multipleStatements: true
  };
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado a la base de datos');
    
    // 1. Verificar si existe la base de datos
    await connection.query('CREATE DATABASE IF NOT EXISTS trigamer_diario');
    await connection.query('USE trigamer_diario');
    console.log('✅ Base de datos trigamer_diario verificada');
    
    // 2. Crear tabla de roles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('✅ Tabla roles creada/verificada');
    
    // 3. Insertar roles básicos
    await connection.query(`
      INSERT IGNORE INTO roles (nombre) VALUES 
      ('administrador'),
      ('colaborador'),
      ('usuario')
    `);
    console.log('✅ Roles insertados');
    
    // 4. Crear tabla de usuarios con estructura correcta
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
    console.log('✅ Tabla users creada/verificada');
    
    // 5. Agregar columna is_active si no existe
    try {
      await connection.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
      console.log('✅ Columna is_active agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Columna is_active ya existe');
      } else {
        throw error;
      }
    }
    
    // 6. Crear usuarios de prueba
    const adminPassword = await bcrypt.hash('w35115415', 10);
    const testPassword = await bcrypt.hash('123456', 10);
    
    // Usuario administrador
    await connection.query(`
      INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
      VALUES (
        'Matias Moreira',
        'matias4315@gmail.com',
        ?,
        (SELECT id FROM roles WHERE nombre = 'administrador'),
        TRUE
      )
    `, [adminPassword]);
    
    // Usuario de prueba
    await connection.query(`
      INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
      VALUES (
        'Usuario Test',
        'test@test.com',
        ?,
        (SELECT id FROM roles WHERE nombre = 'usuario'),
        TRUE
      )
    `, [testPassword]);
    
    console.log('✅ Usuarios de prueba creados');
    
    // 7. Verificar usuarios creados
    const [users] = await connection.query(`
      SELECT u.id, u.nombre, u.email, r.nombre as role, u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);
    
    console.log('\n📊 Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`- ${user.nombre} (${user.email}) - ${user.role} - Activo: ${user.is_active}`);
    });
    
    console.log('\n🎉 Estructura de base de datos corregida exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('Administrador:');
    console.log('  - Email: matias4315@gmail.com');
    console.log('  - Contraseña: w35115415');
    console.log('\nUsuario de prueba:');
    console.log('  - Email: test@test.com');
    console.log('  - Contraseña: 123456');
    
  } catch (error) {
    console.error('❌ Error al corregir la estructura:', error.message);
    console.error('Código de error:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

// Ejecutar el script
fixDatabaseStructure(); 