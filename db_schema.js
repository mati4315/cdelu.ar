const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión a la base de datos
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario',
  connectTimeout: 10000
};

// Esquema de la base de datos
const schema = [
  // Tabla de roles
  `CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  // Tabla de usuarios
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  )`,
  
  // Tabla de noticias
  `CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    image_url VARCHAR(255),
    image_thumbnail_url VARCHAR(500),
    original_url VARCHAR(255),
    diario VARCHAR(100),
    categoria VARCHAR(100),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_oficial BOOLEAN DEFAULT 1,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  // Tabla de comentarios
  `CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  
  // Tabla de likes
  `CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (news_id, user_id),
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`
];

// Datos iniciales
const initialData = [
  // Insertar roles básicos
  `INSERT IGNORE INTO roles (nombre) VALUES ('administrador'), ('editor'), ('usuario')`,
  
  // Insertar usuario administrador predeterminado
  `INSERT IGNORE INTO users (nombre, email, password, role_id)
   SELECT 'Admin', 'matias4315@gmail.com', '$2a$10$M6L5SILQiJ5wMQWL3gdjnOSPE5g0DCpxLIySYeliDK50kfQxRCJOi', id
   FROM roles WHERE nombre = 'administrador'`
];

// Función para crear el esquema de la base de datos
async function createSchema() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa!');
    
    // Crear tablas
    console.log('\n📝 Creando tablas si no existen...');
    for (const query of schema) {
      try {
        await connection.execute(query);
        console.log('✅ Tabla creada/verificada correctamente');
      } catch (error) {
        console.error(`❌ Error al crear tabla: ${error.message}`);
        if (error.message.includes('foreign key constraint fails')) {
          console.log('⚠️ Posible problema de dependencia: asegúrate de que las tablas referenciadas existan primero');
        }
      }
    }
    
    // Insertar datos iniciales
    console.log('\n📊 Insertando datos iniciales...');
    for (const query of initialData) {
      try {
        const [result] = await connection.execute(query);
        console.log(`✅ Datos insertados: ${result.affectedRows} filas afectadas`);
      } catch (error) {
        console.error(`❌ Error al insertar datos: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Verificando tablas creadas...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tablas disponibles en la base de datos:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    console.log('\n✅ Esquema de base de datos creado con éxito!');
    return true;
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(`Mensaje: ${error.message}`);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\nConexión cerrada correctamente.');
      } catch (err) {
        console.error('Error al cerrar la conexión:', err.message);
      }
    }
  }
}

// Generar script SQL
function generateSQLScript() {
  console.log('\n📄 Generando script SQL para crear las tablas manualmente:');
  console.log('\n-- Script para crear el esquema de la base de datos CdelU');
  console.log('-- Ejecutar en orden para respetar las dependencias\n');
  
  for (const query of schema) {
    console.log(`${query};\n`);
  }
  
  console.log('-- Datos iniciales');
  for (const query of initialData) {
    console.log(`${query};\n`);
  }
}

// Ejecutar
createSchema()
  .then(success => {
    if (success) {
      console.log('\nEsquema creado correctamente.');
    } else {
      console.log('\nHubo problemas al crear el esquema.');
      console.log('Aquí tienes el script SQL para crear las tablas manualmente:');
      generateSQLScript();
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError inesperado:', err);
    generateSQLScript();
    process.exit(1);
  }); 