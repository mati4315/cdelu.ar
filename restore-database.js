#!/usr/bin/env node

/**
 * Script para restaurar la BD desde backup SQL
 * Uso: node restore-database.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function restore() {
  const backupFile = path.join(__dirname, 'base de datos', 'trigamer_diario_24 de marzo.sql');
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Archivo de backup no encontrado: ${backupFile}`);
    process.exit(1);
  }

  try {
    console.log('🔄 Leyendo archivo de backup...');
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    // Conectar a MySQL sin base de datos primero
    console.log('🔌 Conectando a MySQL...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

    console.log('✅ Conexión establecida\n');

    // Dividir el SQL en sentencias individuales (simple split)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;
    const totalStatements = statements.length;

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        executedCount++;
        
        if (executedCount % 50 === 0) {
          process.stdout.write(`\r⏳ Restaurando... ${executedCount}/${totalStatements} sentencias`);
        }
      } catch (err) {
        // Algunos errores pueden ser esperados (como IF EXISTS fallando)
        if (!err.message.includes('already exists') && 
            !err.message.includes('Duplicate entry') &&
            !err.message.includes('already exists')) {
          console.error(`\n⚠️  Error en sentencia: ${statement.substring(0, 50)}...`);
          console.error(`   ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Restauración completada: ${executedCount}/${totalStatements} sentencias ejecutadas\n`);
    
    // Verificar tablas
    console.log('📊 Inspeccionando tablas restauradas...');
    const [tables] = await connection.execute('SHOW TABLES FROM trigamer_diario');
    console.log(`   ✓ ${tables.length} tablas encontradas en trigamer_diario\n`);

    // Contar registros importantes
    try {
      const [newsCount] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.news');
      console.log(`   📰 Noticias: ${newsCount[0]?.total || 0}`);
    } catch (e) {
      console.log(`   📰 Noticias: tabla no disponible`);
    }

    try {
      const [usersCount] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.users');
      console.log(`   👤 Usuarios: ${usersCount[0]?.total || 0}`);
    } catch (e) {
      console.log(`   👤 Usuarios: tabla no disponible`);
    }

    try {
      const [adCount] = await connection.execute('SELECT COUNT(*) as total FROM trigamer_diario.ads');
      console.log(`   📣 Publicidades: ${adCount[0]?.total || 0}`);
    } catch (e) {
      console.log(`   📣 Publicidades: tabla no disponible`);
    }

    await connection.end();
    console.log('\n✨ Base de datos restaurada exitosamente!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error durante la restauración:');
    console.error(err.message);
    console.error('\n📌 Posibles causas:');
    console.error('   • MySQL no está corriendo (revisar XAMPP/WAMP)');
    console.error('   • Usuario root no existe o tiene contraseña diferente');
    console.error('   • Puerto no es 3306');
    console.error('\n💡 Intenta:');
    console.error('   1. Abre XAMPP/WAMP y inicia MySQL');
    console.error('   2. Verifica la contraseña en env.local');
    console.error('   3. Ejecuta este script nuevamente');
    process.exit(1);
  }
}

restore();
