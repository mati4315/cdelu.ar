#!/usr/bin/env node

/**
 * Script para diagnosticar estado de la BD y restaurar si está vacía
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function checkAndRestore() {
  try {
    console.log('🔍 Diagnosticando base de datos...\n');
    
    // Conectar
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    console.log('✅ Conexión a trigamer_diario exitosa\n');

    // Contar tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    
    if (tables.length === 0) {
      console.log('⚠️  La BD está completamente vacía (sin tablas)\n');
      console.log('🔄 Iniciando restauración...\n');
      await connection.end();
      
      // Restaurar
      await restaurarBD();
    } else {
      // Contar registros
      console.log('\n📈 Verificando data:');
      
      const queries = [
        ['news', 'SELECT COUNT(*) as total FROM news'],
        ['users', 'SELECT COUNT(*) as total FROM users'],
        ['ads', 'SELECT COUNT(*) as total FROM ads'],
        ['comments', 'SELECT COUNT(*) as total FROM comments'],
        ['likes', 'SELECT COUNT(*) as total FROM likes']
      ];

      let totalRegistros = 0;
      for (const [tabla, query] of queries) {
        try {
          const [result] = await connection.execute(query);
          const count = result[0]?.total || 0;
          console.log(`   • ${tabla}: ${count} registros`);
          totalRegistros += count;
        } catch (e) {
          console.log(`   • ${tabla}: ❌ error o no existe`);
        }
      }

      if (totalRegistros === 0) {
        console.log('\n⚠️  Las tablas existen pero NO hay datos\n');
        console.log('🔄 Iniciando restauración...\n');
        await connection.end();
        await restaurarBD();
      } else {
        console.log(`\n✅ BD tiene ${totalRegistros} registros - parece estar OK`);
        await connection.end();
      }
    }

  } catch (err) {
    console.error('❌ Error de conexión:\n');
    console.error(err.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que MySQL está corriendo (XAMPP/WAMP)');
    console.log('   2. phpMyAdmin debe ser accesible en http://localhost/phpmyadmin');
    console.log('   3. Si MySQL tiene contraseña, edita env.local con DB_PASSWORD=tu_contraseña\n');
    
    console.log('🔄 Intentando restauración directa de todas formas...\n');
    
    try {
      await restaurarBD();
    } catch (e2) {
      console.error('❌ Restauración también falló. MySQL no está disponible.');
      process.exit(1);
    }
  }
}

async function restaurarBD() {
  const backupFile = path.join(__dirname, 'base de datos', 'trigamer_diario_24 de marzo.sql');
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Archivo no encontrado: ${backupFile}`);
    process.exit(1);
  }

  try {
    console.log(`📂 Leyendo backup: ${backupFile}\n`);
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    console.log('⏳ Restaurando...\n');
    
    // Ejecutar todo el SQL de una vez
    await connection.query(sqlContent);
    
    await connection.end();
    console.log('✅ Restauración completada\n');

    // Verificar resultado
    const verifyConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario'
    });

    const [tables] = await verifyConn.execute('SHOW TABLES');
    const [newsCount] = await verifyConn.execute('SELECT COUNT(*) as total FROM news');
    const [usersCount] = await verifyConn.execute('SELECT COUNT(*) as total FROM users');
    
    console.log('📊 Resultado de la restauración:');
    console.log(`   ✓ Tablas: ${tables.length}`);
    console.log(`   ✓ Noticias: ${newsCount[0]?.total || 0}`);
    console.log(`   ✓ Usuarios: ${usersCount[0]?.total || 0}\n`);
    console.log('✨ ¡Listo! Tu BD ha sido restaurada exitosamente');
    
    await verifyConn.end();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error durante restauración:');
    console.error(err.message);
    
    if (err.message.includes('ENOENT')) {
      console.log('\n📂 Verifica que exista el archivo de backup');
    }
    
    process.exit(1);
  }
}

checkAndRestore();
