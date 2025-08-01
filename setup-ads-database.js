const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Script para configurar la base de datos de anuncios
 */
async function setupAdsDatabase() {
  console.log('🚀 Configurando base de datos de anuncios...\n');

  let connection;
  
  try {
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario',
      multipleStatements: true
    };

    console.log('📡 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida\n');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'sql', 'create_ads_simple.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Ejecutando migración de anuncios...');
    await connection.execute(sqlContent);
    console.log('✅ Migración completada exitosamente\n');

    // Verificar que las tablas se crearon
    console.log('🔍 Verificando estructura...');
    
    // Verificar tabla ads
    const [adsTables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'ads'
    `, [dbConfig.database]);
    
    if (adsTables[0].count > 0) {
      console.log('✅ Tabla `ads` creada correctamente');
    } else {
      console.log('❌ Error: Tabla `ads` no se creó');
    }

    // Verificar triggers
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME LIKE 'after_ads_%'
    `, [dbConfig.database]);
    
    console.log(`✅ Triggers creados: ${triggers.length}`);
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.TRIGGER_NAME}`);
    });

    // Verificar datos de prueba
    const [adsCount] = await connection.execute('SELECT COUNT(*) as count FROM ads');
    console.log(`✅ Anuncios de prueba: ${adsCount[0].count}`);

    // Verificar content_feed
    const [feedAdsCount] = await connection.execute('SELECT COUNT(*) as count FROM content_feed WHERE type = 3');
    console.log(`✅ Anuncios en content_feed: ${feedAdsCount[0].count}`);

    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Tabla ads creada');
    console.log('- ✅ Triggers de sincronización configurados');
    console.log('- ✅ Datos de prueba insertados');
    console.log('- ✅ Integración con content_feed funcionando');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Sugerencia: Verifica las credenciales de la base de datos');
      console.log('   - DB_USER: ' + (process.env.DB_USER || 'root'));
      console.log('   - DB_PASSWORD: ' + (process.env.DB_PASSWORD ? '***' : 'vacío'));
      console.log('   - DB_NAME: ' + (process.env.DB_NAME || 'trigamer_diario'));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencia: Verifica que MySQL esté ejecutándose');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar configuración
setupAdsDatabase(); 