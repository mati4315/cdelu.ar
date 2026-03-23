#!/usr/bin/env node

/**
 * Script para verificar el estado de Passenger en cPanel
 * Específico para el hosting con CloudLinux Passenger
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 VERIFICACIÓN DE PASSENGER - CdelU API');
console.log('==========================================\n');

// 1. Verificar configuración de Passenger
console.log('📋 CONFIGURACIÓN DE PASSENGER:');

// Verificar si estamos en el directorio correcto
const expectedPath = '/home/trigamer/diario.trigamer.xyz';
const currentPath = process.cwd();
console.log(`- Directorio actual: ${currentPath}`);
console.log(`- Directorio esperado: ${expectedPath}`);
console.log(`- Coincide: ${currentPath === expectedPath ? '✅' : '❌'}`);

// Verificar archivo de inicio
const startupFile = 'passenger_app.js';
const startupExists = fs.existsSync(startupFile);
console.log(`- Archivo de inicio (${startupFile}): ${startupExists ? '✅' : '❌'}`);

// Verificar Node.js
console.log(`- Versión de Node.js: ${process.version}`);
console.log(`- Arquitectura: ${process.arch}`);
console.log(`- Plataforma: ${process.platform}`);

// 2. Verificar variables de entorno específicas de Passenger
console.log('\n🔧 VARIABLES DE ENTORNO DE PASSENGER:');
const passengerVars = [
  'PASSENGER_APP_ENV',
  'PASSENGER_SPAWN_METHOD',
  'PASSENGER_APP_ROOT',
  'NODE_ENV',
  'PORT'
];

passengerVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`- ${envVar}: ${value || '❌ NO CONFIGURADO'}`);
});

// 3. Verificar estructura de archivos para Passenger
console.log('\n📁 ESTRUCTURA DE ARCHIVOS:');
const requiredFiles = [
  'passenger_app.js',
  'src/index.js',
  'src/app.js',
  'package.json',
  'public/config.js'
];

const requiredDirs = [
  'src',
  'public',
  'node_modules'
];

console.log('Archivos requeridos:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const stats = exists ? fs.statSync(file) : null;
  console.log(`  - ${file}: ${exists ? '✅' : '❌'} ${stats ? `(${stats.size} bytes)` : ''}`);
});

console.log('\nDirectorios requeridos:');
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`  - ${dir}/: ${exists ? '✅' : '❌'}`);
});

// 4. Verificar permisos de archivos
console.log('\n🔐 PERMISOS DE ARCHIVOS:');
try {
  const passengerAppStats = fs.statSync('passenger_app.js');
  const permissions = (passengerAppStats.mode & parseInt('777', 8)).toString(8);
  console.log(`- passenger_app.js permisos: ${permissions} ${permissions >= '644' ? '✅' : '❌'}`);
} catch (error) {
  console.log(`- passenger_app.js permisos: ❌ Error: ${error.message}`);
}

// 5. Test de carga del módulo principal
console.log('\n🧪 TEST DE CARGA DE MÓDULOS:');
try {
  console.log('- Cargando dotenv...');
  require('dotenv').config();
  console.log('  ✅ dotenv cargado correctamente');
  
  console.log('- Verificando dependencias críticas...');
  const criticalModules = ['fastify', 'mysql2', '@fastify/cors'];
  
  for (const module of criticalModules) {
    try {
      require(module);
      console.log(`  ✅ ${module} disponible`);
    } catch (err) {
      console.log(`  ❌ ${module} no disponible: ${err.message}`);
    }
  }
  
} catch (error) {
  console.log(`❌ Error al cargar módulos: ${error.message}`);
}

// 6. Verificar configuración de base de datos
console.log('\n🗄️ CONFIGURACIÓN DE BASE DE DATOS:');
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER || 'NO_CONFIGURADO',
  database: process.env.DB_NAME || 'NO_CONFIGURADO'
};

Object.entries(dbConfig).forEach(([key, value]) => {
  console.log(`- ${key}: ${value}`);
});

// 7. Test de conexión a base de datos
console.log('\n🔌 TEST DE CONEXIÓN A BASE DE DATOS:');
async function testDatabaseConnection() {
  try {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.user,
      password: process.env.DB_PASSWORD || '',
      database: dbConfig.database,
      connectTimeout: 5000
    });
    
    await connection.ping();
    await connection.end();
    
    console.log('- Estado: ✅ CONEXIÓN EXITOSA');
    return true;
  } catch (error) {
    console.log(`- Estado: ❌ ERROR: ${error.message}`);
    console.log(`- Código: ${error.code || 'N/A'}`);
    return false;
  }
}

// 8. Información de memoria y recursos
console.log('\n💾 RECURSOS DEL SISTEMA:');
const memory = process.memoryUsage();
console.log(`- Memoria RSS: ${Math.round(memory.rss / 1024 / 1024)} MB`);
console.log(`- Heap Total: ${Math.round(memory.heapTotal / 1024 / 1024)} MB`);
console.log(`- Heap Usado: ${Math.round(memory.heapUsed / 1024 / 1024)} MB`);
console.log(`- Memoria libre del sistema: ${Math.round(os.freemem() / 1024 / 1024)} MB`);

// 9. Recomendaciones específicas para Passenger
console.log('\n💡 RECOMENDACIONES PARA PASSENGER:');
console.log('1. Asegúrate de que passenger_app.js tenga permisos 644 o superiores');
console.log('2. Verifica que todas las dependencias estén instaladas con npm ci');
console.log('3. Configura las variables de entorno en el panel de cPanel');
console.log('4. Reinicia la aplicación desde cPanel > Setup Node.js App');
console.log('5. Revisa los logs de error de Passenger en cPanel > Logs');
console.log('6. Si persisten los errores, usa emergency_start.js temporalmente');

// Ejecutar test de base de datos
testDatabaseConnection().then((success) => {
  console.log('\n🏁 VERIFICACIÓN COMPLETADA');
  console.log('==========================================');
  
  if (!success) {
    console.log('\n⚠️ PROBLEMAS DETECTADOS:');
    console.log('- La conexión a la base de datos falló');
    console.log('- Verifica las credenciales en las variables de entorno');
    console.log('- Asegúrate de que la base de datos esté creada en cPanel');
  }
}).catch(error => {
  console.log(`\n❌ Error durante la verificación: ${error.message}`);
}); 