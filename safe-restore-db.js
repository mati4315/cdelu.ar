#!/usr/bin/env node

/**
 * Script para restaurar BD ignorando errores de tablespace
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function restore() {
  const backupFile = path.join(__dirname, 'base de datos', 'trigamer_diario_24 de marzo.sql');
  
  console.log('🔄 Preparando restauración...\n');

  try {
    // Leer el SQL
    console.log('📂 Leyendo archivo de backup...');
    let sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    // Limpiar warnings y errores de estructura
    sqlContent = sqlContent.replace(/\/\*!40000 ALTER TABLE .+?ENABLE KEYS \*\/;/g, '');
    sqlContent = sqlContent.replace(/\/\*!50013 DEFINER=.+?SQL SECURITY DEFINER \*\//g, '/*! SQL SECURITY DEFINER */');
    
    console.log('✅ Archivo cargado\n');

    // Conectar
    console.log('🔌 Conectando a MySQL...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    console.log('✅ Conectado\n');

    // Ejecutar SQL
    console.log('⏳ Restaurando datos...\n');
    try {
      await connection.query(sqlContent);
    } catch (e) {
      // Algunos errores de estructura son OK, continuar
      if (!e.message.includes('already exists') && 
          !e.message.includes('Duplicate entry') &&
          !e.message.includes('Tablespace')) {
        throw e;
      }
    }

    // Verificar resultado
    console.log('\n✅ RESTAURACIÓN COMPLETADA\n');
    
    const [tables] = await connection.execute('SHOW TABLES FROM trigamer_diario');
    console.log(`📊 Tablas: ${tables.length}`);
    
    try {
      const [news] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.news');
      console.log(`📰 Noticias: ${news[0]?.total || 0}`);
    } catch (e) {}
    
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.users');
      console.log(`👤 Usuarios: ${users[0]?.total || 0}`);
    } catch (e) {}
    
    try {
      const [ads] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.ads');
      console.log(`📣 Publicidades: ${ads[0]?.total || 0}`);
    } catch (e) {}

    await connection.end();
    console.log('\n✨ ¡Base de datos restaurada exitosamente!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:\n');
    console.error(err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 MySQL no está corriendo. Inicia XAMPP.');
    } else if (err.code === 'ENOENT') {
      console.log('\n💡 Archivo de backup no encontrado');
    }
    
    process.exit(1);
  }
}

restore();
