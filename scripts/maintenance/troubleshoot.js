const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Información del sistema
console.log('=====================================');
console.log('DIAGNÓSTICO DEL SERVIDOR - CDELU.AR');
console.log('=====================================');
console.log(`Fecha y hora: ${new Date().toISOString()}`);
console.log(`Node.js: ${process.version}`);
console.log(`Plataforma: ${process.platform}`);
console.log(`Directorio actual: ${process.cwd()}`);
console.log('-------------------------------------');

// Verificar archivos críticos
console.log('\n📂 VERIFICANDO ARCHIVOS CRÍTICOS:');
const criticalFiles = [
  '.htaccess',
  'passenger_app.js',
  '.env',
  'src/index.js',
  'src/app.js',
  'src/config/database.js'
];

criticalFiles.forEach(file => {
  try {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    
    if (exists && file === '.htaccess') {
      const content = fs.readFileSync(file, 'utf8');
      const hasPassengerConfig = content.includes('CLOUDLINUX PASSENGER CONFIGURATION');
      console.log(`  └─ ${hasPassengerConfig ? '✅' : '❌'} Configuración de Passenger`);
    }
  } catch (err) {
    console.log(`❌ Error al verificar ${file}: ${err.message}`);
  }
});

// Verificar variables de entorno
console.log('\n🔒 VERIFICANDO VARIABLES DE ENTORNO:');
try {
  require('dotenv').config();
  const envVars = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET'
  ];
  
  envVars.forEach(envVar => {
    const exists = process.env[envVar] !== undefined;
    // No mostrar la contraseña real
    const value = envVar === 'DB_PASSWORD' 
      ? (process.env[envVar] ? '********' : '[VACÍO]')
      : process.env[envVar] || '[VACÍO]';
    
    console.log(`${exists ? '✅' : '❌'} ${envVar}: ${value}`);
  });
} catch (err) {
  console.log(`❌ Error al verificar variables de entorno: ${err.message}`);
}

// Probar conexión a la base de datos
console.log('\n🔌 PROBANDO CONEXIÓN A LA BASE DE DATOS:');
async function testDatabaseConnection() {
  let connection;
  
  // Configuración de conexión
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario',
    connectTimeout: 10000,
    supportBigNumbers: true,
    bigNumberStrings: true
  };
  
  console.log('Configuración de conexión:');
  console.log({
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });
  
  try {
    console.log('\nIntentando conectar a la base de datos...');
    connection = await mysql.createConnection(config);
    console.log('✅ CONEXIÓN EXITOSA A LA BASE DE DATOS!');
    
    // Prueba 1: Verificar tablas
    console.log('\nPrueba 1: Verificando tablas existentes...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Se encontraron ${tables.length} tablas`);
    
    if (tables.length > 0) {
      console.log('\nTablas disponibles:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }
    
    // Prueba 2: Consultar registros en tablas clave
    console.log('\nPrueba 2: Consultando registros en tablas clave...');
    
    // Verificar usuarios
    try {
      const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Tabla users: ${users[0].count} registros`);
    } catch (err) {
      console.log(`❌ Error al consultar tabla users: ${err.message}`);
    }
    
    // Verificar noticias
    try {
      const [news] = await connection.query('SELECT COUNT(*) as count FROM news');
      console.log(`✅ Tabla news: ${news[0].count} registros`);
    } catch (err) {
      console.log(`❌ Error al consultar tabla news: ${err.message}`);
    }
    
    // Verificar roles
    try {
      const [roles] = await connection.query('SELECT COUNT(*) as count FROM roles');
      console.log(`✅ Tabla roles: ${roles[0].count} registros`);
    } catch (err) {
      console.log(`❌ Error al consultar tabla roles: ${err.message}`);
    }
    
    return true;
  } catch (err) {
    console.log('❌ ERROR DE CONEXIÓN A LA BASE DE DATOS:');
    console.log(`Mensaje: ${err.message}`);
    console.log(`Código: ${err.code || 'No disponible'}`);
    
    // Recomendaciones basadas en el error
    console.log('\n🔧 RECOMENDACIONES:');
    
    if (err.code === 'ECONNREFUSED') {
      console.log('- El servidor MySQL no está disponible o está bloqueado');
      console.log('- Verifica que MySQL esté ejecutándose en el servidor');
      console.log('- Comprueba si el host y puerto son correctos');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- Credenciales incorrectas (usuario o contraseña)');
      console.log('- Verifica los valores de DB_USER y DB_PASSWORD en .env');
      console.log('- Confirma los permisos del usuario en cPanel > MySQL Databases');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('- La base de datos especificada no existe');
      console.log('- Verifica el valor de DB_NAME en .env');
      console.log('- Crea la base de datos en cPanel si no existe');
    } else {
      console.log('- Verifica la configuración en el archivo .env');
      console.log('- Confirma que el usuario tenga permisos para conectarse remotamente');
      console.log('- Consulta con el soporte de hosting para verificar restricciones');
    }
    
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada.');
    }
  }
}

// Verificar rutas de archivos
console.log('\n🛣️  VERIFICANDO RUTAS DE ARCHIVOS:');
const publicPath = path.join(process.cwd(), 'public');
try {
  if (fs.existsSync(publicPath)) {
    console.log(`✅ Directorio public: ${publicPath}`);
    
    // Verificar archivos clave
    const publicFiles = ['login.html', 'dashboard.html'];
    publicFiles.forEach(file => {
      const fullPath = path.join(publicPath, file);
      const exists = fs.existsSync(fullPath);
      console.log(`  └─ ${exists ? '✅' : '❌'} ${file}`);
    });
  } else {
    console.log(`❌ No se encontró el directorio public`);
  }
} catch (err) {
  console.log(`❌ Error al verificar rutas de archivos: ${err.message}`);
}

// Ejecutar prueba de conexión y terminar el programa
testDatabaseConnection()
  .then(() => {
    console.log('\n=====================================');
    console.log('DIAGNÓSTICO COMPLETADO');
    console.log('=====================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError inesperado:', err);
    process.exit(1);
  }); 