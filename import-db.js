#!/usr/bin/env node

/**
 * Script para restaurar BD trigamer_diario desde backup
 * Usa mysql.exe de XAMPP
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mysqlBinDir = 'D:\\Archivos de programas\\xampp2\\mysql\\bin';
const mysql = path.join(mysqlBinDir, 'mysql.exe');
const backupFile = path.join(__dirname, 'base de datos', 'trigamer_diario_24 de marzo.sql');

console.log('🔍 Verificando archivos...\n');

// Verificar que mysql existe
if (!fs.existsSync(mysql)) {
  console.error('❌ No se encontró mysql.exe en:', mysql);
  process.exit(1);
}

// Verificar que backup existe
if (!fs.existsSync(backupFile)) {
  console.error('❌ No se encontró archivo de backup en:', backupFile);
  process.exit(1);
}

const stats = fs.statSync(backupFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`✅ mysql.exe encontrado`);
console.log(`📂 Backup a usar: trigamer_diario_24 de marzo.sql`);
console.log(`📏 Tamaño: ${sizeMB} MB\n`);

try {
  console.log('⏳ Restaurando base de datos...\n');
  
  const cmd = `"${mysql}" -u root trigamer_diario < "${backupFile}"`;
  
  execSync(cmd, { 
    shell: true,
    stdio: 'inherit'
  });

  console.log('\n✅ RESTAURACIÓN EXITOSA\n');
  console.log('🎉 Base de datos trigamer_diario ha sido restaurada');
  console.log('📊 Datos recuperados del backup del 25 de marzo de 2026\n');
  console.log('✨ Ya puedes usar la BD normalmente!');

} catch (err) {
  console.error('\n❌ Error durante la restauración:\n');
  console.error(err.message);
  console.log('\n💡 Posibles causas:');
  console.log('   • MySQL no está corriendo');
  console.log('   • Archivo SQL corrupto');
  console.log('   • Problemas de permisos\n');
  process.exit(1);
}
