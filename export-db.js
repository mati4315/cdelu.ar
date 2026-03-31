#!/usr/bin/env node

/**
 * Script para exportar BD trigamer_diario
 * La guarda en: D:\Archivos de programas\xampp2\mysql\copia de seguridad
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = 'D:\\Archivos de programas\\xampp2\\mysql\\copia de seguridad';
const mysqlBinDir = 'D:\\Archivos de programas\\xampp2\\mysql\\bin';
const mysqldump = path.join(mysqlBinDir, 'mysqldump.exe');

console.log('🔍 Verificando rutas...\n');

// Verificar que mysqldump existe
if (!fs.existsSync(mysqldump)) {
  console.error('❌ No se encontró mysqldump en:', mysqldump);
  console.error('\n💡 Verifica que XAMPP está en: D:\\Archivos de programas\\xampp2\\\n');
  process.exit(1);
}

// Crear carpeta de backup si no existe
if (!fs.existsSync(backupDir)) {
  console.log(`📁 Creando carpeta: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `trigamer_diario_${timestamp}.sql`);

console.log(`✅ mysqldump encontrado\n`);
console.log(`📂 Backup se guardará en:\n   ${backupFile}\n`);

try {
  console.log('⏳ Exportando base de datos...\n');
  
  const cmd = `"${mysqldump}" -u root trigamer_diario > "${backupFile}"`;
  
  execSync(cmd, { 
    shell: true,
    stdio: 'inherit'
  });

  // Verificar que se creó
  if (!fs.existsSync(backupFile)) {
    throw new Error('El archivo de backup no se creó');
  }

  const stats = fs.statSync(backupFile);
  const sizeKB = Math.round(stats.size / 1024);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ EXPORTACIÓN EXITOSA\n');
  console.log(`📦 Archivo: ${path.basename(backupFile)}`);
  console.log(`📏 Tamaño: ${sizeKB} KB (${sizeMB} MB)`);
  console.log(`📁 Ubicación: ${backupDir}\n`);
  console.log('✨ Backup completado exitosamente!');

} catch (err) {
  console.error('\n❌ Error durante la exportación:\n');
  console.error(err.message);
  console.log('\n💡 Posibles causas:');
  console.log('   • MySQL no está corriendo en XAMPP');
  console.log('   • La ruta de XAMPP es diferente');
  console.log('   • No hay permisos para escribir en la carpeta\n');
  process.exit(1);
}
