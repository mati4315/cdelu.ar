#!/usr/bin/env node

/**
 * Script de diagnóstico para cPanel
 * Ayuda a identificar problemas comunes en el hosting
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 DIAGNÓSTICO DE CPANEL - CdelU API');
console.log('=====================================\n');

// 1. Información del sistema
console.log('📊 INFORMACIÓN DEL SISTEMA:');
console.log(`- Node.js versión: ${process.version}`);
console.log(`- Plataforma: ${os.platform()} ${os.arch()}`);
console.log(`- Memoria total: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
console.log(`- Memoria libre: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
console.log(`- Directorio actual: ${process.cwd()}`);
console.log(`- Usuario: ${os.userInfo().username}`);
console.log('');

// 2. Variables de entorno críticas
console.log('🔧 VARIABLES DE ENTORNO:');
const criticalEnvVars = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
criticalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    // Ocultar valores sensibles
    const displayValue = envVar.includes('SECRET') || envVar.includes('PASSWORD') 
      ? '***CONFIGURADO***' 
      : value;
    console.log(`- ${envVar}: ${displayValue}`);
  } else {
    console.log(`- ${envVar}: ❌ NO CONFIGURADO`);
  }
});
console.log('');

// 3. Verificar archivos críticos
console.log('📁 ARCHIVOS CRÍTICOS:');
const criticalFiles = [
  'package.json',
  'src/index.js',
  'src/app.js',
  'src/config/default.js',
  'src/config/database.js',
  'public/config.js',
  '.env'
];

criticalFiles.forEach(file => {
  try {
    const exists = fs.existsSync(file);
    const stats = exists ? fs.statSync(file) : null;
    console.log(`- ${file}: ${exists ? '✅' : '❌'} ${stats ? `(${stats.size} bytes)` : ''}`);
  } catch (error) {
    console.log(`- ${file}: ❌ Error: ${error.message}`);
  }
});
console.log('');

// 4. Verificar dependencias
console.log('📦 DEPENDENCIAS:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  console.log(`- Total de dependencias: ${dependencies.length}`);
  
  // Verificar dependencias críticas
  const criticalDeps = ['fastify', 'mysql2', 'jsonwebtoken', '@fastify/cors'];
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies[dep];
    console.log(`- ${dep}: ${version ? `✅ ${version}` : '❌ NO INSTALADO'}`);
  });
  
  // Verificar si node_modules existe
  const nodeModulesExists = fs.existsSync('node_modules');
  console.log(`- node_modules: ${nodeModulesExists ? '✅' : '❌'}`);
} catch (error) {
  console.log(`❌ Error al leer package.json: ${error.message}`);
}
console.log('');

// 5. Test de conexión a base de datos
console.log('🗄️ PRUEBA DE BASE DE DATOS:');
async function testDatabase() {
  try {
    require('dotenv').config();
    const mysql = require('mysql2/promise');
    
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario',
      connectTimeout: 5000
    };
    
    console.log(`- Intentando conectar a: ${config.user}@${config.host}:${config.port}/${config.database}`);
    
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    
    console.log('- Estado: ✅ CONEXIÓN EXITOSA');
  } catch (error) {
    console.log(`- Estado: ❌ ERROR: ${error.message}`);
    console.log(`- Código de error: ${error.code}`);
  }
}

// 6. Verificar puertos
console.log('🌐 CONFIGURACIÓN DE RED:');
const port = process.env.PORT || 3001;
console.log(`- Puerto configurado: ${port}`);
console.log(`- Host configurado: 0.0.0.0`);

// 7. Recomendaciones
console.log('\n💡 RECOMENDACIONES PARA CPANEL:');
console.log('1. Asegúrate de que Node.js esté habilitado en tu plan de hosting');
console.log('2. Configura las variables de entorno en el panel de cPanel');
console.log('3. Verifica que la base de datos MySQL esté creada y accesible');
console.log('4. Asegúrate de que el puerto 3001 esté disponible');
console.log('5. Configura el archivo .htaccess para redirigir las peticiones de API');
console.log('6. Revisa los logs de error de cPanel para más detalles');

// Ejecutar test de base de datos
testDatabase().then(() => {
  console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
  console.log('=====================================');
}).catch(error => {
  console.log(`\n❌ Error durante el diagnóstico: ${error.message}`);
}); 