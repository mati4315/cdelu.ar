const mysql = require('mysql2/promise');
require('dotenv').config();

// Mostrar la configuración actual (sin contraseña)
console.log('Configuración de base de datos:');
console.log({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3309,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'trigamer_diario',
  ssl: process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado'
});

// Función para probar la conexión
async function testDatabaseConnection() {
  console.log('\n🔍 Probando conexión a la base de datos...');
  
  // Crear configuración de conexión
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario',
    connectTimeout: 10000,
    // SSL si está configurado
    ssl: process.env.DB_SSL === 'true' ? {} : undefined
  };
  
  let connection;
  
  try {
    console.log('⏳ Intentando conectar...');
    connection = await mysql.createConnection(config);
    
    console.log('✅ Conexión exitosa!');
    
    // Probar consulta simple
    console.log('\n🔍 Probando consulta simple...');
    
    // Verificar tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Consulta exitosa! Tablas encontradas: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('\nTablas disponibles:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
      
      // Verificar que la tabla "users" exista
      const userTableExists = tables.some(table => Object.values(table)[0] === 'users');
      
      if (userTableExists) {
        // Contar usuarios
        const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`\n👤 Total de usuarios en la base de datos: ${usersCount[0].count}`);
        
        // Mostrar usuarios (sin contraseña)
        const [users] = await connection.query('SELECT id, nombre, email, role_id FROM users LIMIT 3');
        if (users.length > 0) {
          console.log('\nPrimeros 3 usuarios (muestra):');
          users.forEach(user => {
            console.log(`- ID: ${user.id}, Nombre: ${user.nombre}, Email: ${user.email}`);
          });
        }
      } else {
        console.log('\n⚠️ No se encontró la tabla "users" en la base de datos.');
      }
    }
    
    console.log('\n✅ PRUEBA COMPLETA: Conexión a la base de datos funciona correctamente!');
    return true;
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error(`Mensaje: ${error.message}`);
    console.error(`Código: ${error.code || 'No disponible'}`);
    console.error(`Stack: ${error.stack || 'No disponible'}`);
    
    // Sugerencias basadas en el error
    console.log('\n🔧 SUGERENCIAS:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('- Verifica que el servidor MySQL esté funcionando');
      console.log('- Confirma que el host y puerto sean correctos');
      console.log('- Asegúrate que el firewall permita conexiones al puerto MySQL');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- El usuario o contraseña son incorrectos');
      console.log('- Verifica que el usuario tenga permisos para acceder a la base de datos');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('- La base de datos especificada no existe');
      console.log('- Verifica el nombre de la base de datos');
    } else if (error.code === 'ER_HOSTNAME') {
      console.log('- No se puede resolver el nombre de host');
      console.log('- Prueba usando una dirección IP en lugar del nombre de host');
    } else {
      console.log('- Verifica la configuración de conexión en el archivo .env');
      console.log('- Asegúrate que el servidor MySQL está aceptando conexiones remotas');
      console.log('- Comprueba los logs del servidor MySQL para más detalles');
    }
    
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

// Ejecutar la prueba
testDatabaseConnection()
  .then(() => {
    console.log('\nPrueba completada.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError inesperado durante la prueba:', err);
    process.exit(1);
  }); 