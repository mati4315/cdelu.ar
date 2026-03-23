#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estructura de la base de datos...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cdelu_diario'
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Mostrar todas las tablas
    const [tables] = await connection.execute(`SHOW TABLES`);
    console.log('📋 Tablas en la base de datos:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    console.log('');

    // Verificar estructura de cada tabla
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`🔍 Estructura de la tabla: ${tableName}`);
      
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`);
      });
      console.log('');
    }

    // Verificar datos en las tablas
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`📊 ${tableName}: ${count[0].count} registros`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
checkDatabaseStructure(); 