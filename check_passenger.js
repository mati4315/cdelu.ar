const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

console.log('=======================================');
console.log('VERIFICACIÓN DE PASSENGER & SERVIDOR WEB');
console.log('=======================================');
console.log(`Fecha y hora: ${new Date().toISOString()}`);
console.log(`Node.js: ${process.version}`);
console.log(`Plataforma: ${process.platform}`);

// Verificar archivo .htaccess
console.log('\n📄 VERIFICANDO CONFIGURACIÓN DE APACHE:');
try {
  const htaccessPath = path.join(process.cwd(), '.htaccess');
  if (fs.existsSync(htaccessPath)) {
    const content = fs.readFileSync(htaccessPath, 'utf8');
    console.log('✅ Archivo .htaccess encontrado');
    
    // Verificar configuración de Passenger
    if (content.includes('CLOUDLINUX PASSENGER CONFIGURATION')) {
      console.log('✅ Configuración de Passenger encontrada');
      
      // Extraer información relevante
      const appRoot = content.match(/PassengerAppRoot "([^"]+)"/);
      const baseURI = content.match(/PassengerBaseURI "([^"]+)"/);
      const nodejs = content.match(/PassengerNodejs "([^"]+)"/);
      const startupFile = content.match(/PassengerStartupFile ([^\s]+)/);
      
      console.log('\nDetalles de configuración:');
      console.log(`- App Root: ${appRoot ? appRoot[1] : 'No especificado'}`);
      console.log(`- Base URI: ${baseURI ? baseURI[1] : 'No especificado'}`);
      console.log(`- Node.js Path: ${nodejs ? nodejs[1] : 'No especificado'}`);
      console.log(`- Startup File: ${startupFile ? startupFile[1] : 'No especificado'}`);
      
      // Verificar existencia del archivo de inicio
      if (startupFile) {
        const startupFilePath = path.join(process.cwd(), startupFile[1]);
        const startupFileExists = fs.existsSync(startupFilePath);
        console.log(`- Archivo de inicio existe: ${startupFileExists ? '✅ Sí' : '❌ No'}`);
      }
    } else {
      console.log('❌ No se encontró configuración de Passenger en .htaccess');
    }
    
    // Verificar reglas de reescritura
    if (content.includes('RewriteEngine On')) {
      console.log('✅ RewriteEngine activado');
      
      // Verificar redirecciones para archivos estáticos
      const hasStaticRules = content.includes('RewriteCond %{REQUEST_FILENAME} -f') || 
                             content.includes('RewriteCond %{REQUEST_FILENAME} -d');
      console.log(`- Reglas para archivos estáticos: ${hasStaticRules ? '✅ Sí' : '❌ No'}`);
      
      // Verificar redirección a la carpeta public
      const hasPublicRedirect = content.includes('RewriteRule ^(.*)$ public/$1');
      console.log(`- Redirección a carpeta public: ${hasPublicRedirect ? '✅ Sí' : '❌ No'}`);
    } else {
      console.log('❌ RewriteEngine no está activado');
    }
    
    // Verificar encabezados CORS
    if (content.includes('Access-Control-Allow-Origin')) {
      console.log('✅ Encabezados CORS configurados');
    } else {
      console.log('❌ Encabezados CORS no configurados');
    }
  } else {
    console.log('❌ No se encontró el archivo .htaccess');
  }
} catch (error) {
  console.log(`❌ Error al leer .htaccess: ${error.message}`);
}

// Verificar archivo de inicio de Passenger
console.log('\n📄 VERIFICANDO ARCHIVO DE INICIO:');
try {
  const passengerAppPath = path.join(process.cwd(), 'passenger_app.js');
  if (fs.existsSync(passengerAppPath)) {
    console.log('✅ Archivo passenger_app.js encontrado');
    
    const content = fs.readFileSync(passengerAppPath, 'utf8');
    // Verificar si carga correctamente el archivo principal
    if (content.includes('require(\'./src/index.js\')')) {
      console.log('✅ El archivo carga correctamente src/index.js');
    } else {
      console.log('❌ El archivo no carga src/index.js correctamente');
    }
  } else {
    console.log('❌ No se encontró el archivo passenger_app.js');
  }
} catch (error) {
  console.log(`❌ Error al verificar archivo de inicio: ${error.message}`);
}

// Verificar puerto y disponibilidad
console.log('\n🔌 VERIFICANDO PUERTO:');
try {
  require('dotenv').config();
  const port = process.env.PORT || 3001;
  console.log(`Puerto configurado: ${port}`);
  
  // Verificar si el puerto está en uso
  const testServer = http.createServer();
  testServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`❌ El puerto ${port} ya está en uso`);
      console.log('Esto puede indicar que hay otra instancia de la aplicación ejecutándose');
    } else {
      console.log(`❌ Error al verificar puerto: ${error.message}`);
    }
  });
  
  testServer.on('listening', () => {
    console.log(`✅ El puerto ${port} está disponible`);
    testServer.close();
  });
  
  // Intentar vincular al puerto
  testServer.listen(port);
} catch (error) {
  console.log(`❌ Error al verificar puerto: ${error.message}`);
}

// Verificar configuración CORS
console.log('\n🔒 VERIFICANDO CONFIGURACIÓN CORS:');
try {
  const configPath = path.join(process.cwd(), 'src/config/default.js');
  if (fs.existsSync(configPath)) {
    console.log('✅ Archivo de configuración encontrado');
    
    // Intentar cargar la configuración
    try {
      const config = require('./src/config/default');
      console.log(`- CORS Origin: ${config.corsOrigin || 'No especificado'}`);
      
      if (config.corsOrigin === '*') {
        console.log('⚠️ Advertencia: CORS está configurado para permitir cualquier origen');
      } else if (config.corsOrigin) {
        console.log('✅ CORS está configurado con restricciones de origen');
      } else {
        console.log('❌ CORS no está configurado correctamente');
      }
    } catch (error) {
      console.log(`❌ Error al cargar configuración: ${error.message}`);
    }
  } else {
    console.log('❌ No se encontró el archivo de configuración');
  }
} catch (error) {
  console.log(`❌ Error al verificar configuración CORS: ${error.message}`);
}

// Resumen y recomendaciones
console.log('\n📋 RESUMEN Y RECOMENDACIONES:');
console.log(`
1. Si tienes errores 500, verifica:
   - La conexión a la base de datos (ejecuta troubleshoot.js)
   - Que el archivo passenger_app.js existe y carga correctamente index.js
   - Que el usuario de la base de datos tiene permisos correctos
   - Que el .htaccess está configurado correctamente

2. Si recibes HTML en lugar de JSON:
   - La solicitud no está llegando a tu aplicación Node.js
   - Verifica que PassengerBaseURI esté configurado correctamente
   - Asegúrate que las reglas de reescritura no interfieran con las rutas API

3. Para diagnóstico adicional:
   - Revisa los logs de Apache (error_log) en cPanel
   - Asegúrate que la aplicación tiene permisos para ejecutarse
   - Verifica que la versión de Node.js sea compatible (Passenger 6 requiere Node.js <= 16)
`);

console.log('\n=======================================');
console.log('VERIFICACIÓN COMPLETADA');
console.log('======================================='); 