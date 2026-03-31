#!/usr/bin/env node

/**
 * Script para limpiar y restaurar BD trigamer_diario
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mysqlBinDir = 'D:\\Archivos de programas\\xampp2\\mysql\\bin';
const mysql = path.join(mysqlBinDir, 'mysql.exe');
const backupFile = path.join(__dirname, 'base de datos', 'trigamer_diario_24 de marzo.sql');

console.log('🔄 Preparando restauración...\n');

try {
  // Paso 1: Eliminar BD existente
  console.log('🗑️  Eliminando base de datos actual...');
  execSync(`"${mysql}" -u root -e "DROP DATABASE IF EXISTS trigamer_diario;"`, {
    shell: true,
    stdio: 'pipe'
  });
  console.log('✅ Completado\n');

  // Paso 2: Recrear BD vacía
  console.log('📝 Creando base de datos limpia...');
  execSync(`"${mysql}" -u root -e "CREATE DATABASE trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"`, {
    shell: true,
    stdio: 'pipe'
  });
  console.log('✅ Completado\n');

  // Paso 3: Restaurar desde backup
  console.log('⏳ Restaurando datos desde backup...\n');
  execSync(`"${mysql}" -u root trigamer_diario < "${backupFile}"`, {
    shell: true,
    stdio: 'inherit'
  });

  console.log('\n✅ RESTAURACIÓN EXITOSA\n');
  console.log('🎉 Base de datos trigamer_diario restaurada completamente');
  console.log('📊 Datos del backup del 25 de marzo de 2026 han sido importados\n');
  console.log('✨ Puedes usar la BD normalmente ahora!');

} catch (err) {
  console.error('\n❌ Error en el proceso:\n');
  console.error(err.message);
  
  if (err.message.includes('already exists')) {
    console.log('\n💡 Parece que MySQL se reinició. Intenta nuevamente.');
  }
  
  process.exit(1);
}
