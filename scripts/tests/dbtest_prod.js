const mysql = require('mysql2/promise');

// Configuración específica para producción
const config = {
  host: 'localhost',
  port: 3306,
  user: 'trigamer_diario',
  password: '', // Dejar en blanco - completar manualmente al ejecutar
  database: 'trigamer_diario',
  connectTimeout: 10000
};

// Mostrar la configuración actual (sin contraseña)
console.log('Configuración de base de datos de PRODUCCIÓN:');
console.log({
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database
});

// Función para probar la conexión
async function testDatabaseConnection() {
  console.log('\n🔍 Probando conexión a la base de datos de PRODUCCIÓN...');
  
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

        // Verificar roles
        const [roles] = await connection.query('SELECT * FROM roles');
        if (roles.length > 0) {
          console.log('\nRoles disponibles:');
          roles.forEach(role => {
            console.log(`- ID: ${role.id}, Nombre: ${role.nombre}`);
          });
        } else {
          console.log('\n⚠️ No se encontraron roles en la tabla "roles".');
        }
      } else {
        console.log('\n⚠️ No se encontró la tabla "users" en la base de datos.');
      }
    }
    
    console.log('\n✅ PRUEBA COMPLETA: Conexión a la base de datos de producción funciona correctamente!');
    return true;
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error(`Mensaje: ${error.message}`);
    console.error(`Código: ${error.code || 'No disponible'}`);
    
    // Sugerencias basadas en el error
    console.log('\n🔧 SUGERENCIAS PARA PRODUCCIÓN:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('- Verifica que el servidor MySQL esté funcionando en el hosting');
      console.log('- Confirma que estás usando el host correcto (generalmente localhost en cPanel)');
      console.log('- Asegúrate que el servidor permita conexiones desde la aplicación Node.js');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- El nombre de usuario o contraseña son incorrectos');
      console.log('- Verifica las credenciales en el panel de cPanel > Bases de datos MySQL');
      console.log('- Asegúrate que el usuario trigamer_diario tiene permisos en la base de datos');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('- La base de datos trigamer_diario no existe');
      console.log('- Verifica el nombre de la base de datos en cPanel');
      console.log('- Crea la base de datos si no existe');
    } else {
      console.log('- Verifica la configuración de conexión en el archivo .env y .htaccess');
      console.log('- Contacta al soporte de hosting para confirmar las credenciales correctas');
      console.log('- Asegúrate que el servidor MySQL está aceptando conexiones desde aplicaciones Node.js');
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
    console.log('\nPrueba de producción completada.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError inesperado durante la prueba:', err);
    process.exit(1);
  }); 