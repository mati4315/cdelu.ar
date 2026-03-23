const fs = require('fs');
const path = require('path');
const pool = require('./src/config/database');

async function setupSurveysDatabase() {
  console.log('🚀 Configurando sistema de encuestas...');
  
  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'sql', 'create_surveys_tables_simple.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Archivo SQL no encontrado:', sqlFile);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          await pool.execute(command);
          console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
        } catch (error) {
          // Ignorar errores de "ya existe" para tablas y triggers
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_TRG_ALREADY_EXISTS' ||
              error.message.includes('already exists')) {
            console.log(`⚠️ Comando ${i + 1} ya existe, continuando...`);
          } else {
            console.error(`❌ Error en comando ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Sistema de encuestas configurado correctamente');
    
    // Verificar que las tablas se crearon correctamente
    const tables = ['surveys', 'survey_options', 'survey_votes', 'survey_stats'];
    
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Tabla ${table} existe`);
        } else {
          console.log(`❌ Tabla ${table} no existe`);
        }
      } catch (error) {
        console.error(`❌ Error verificando tabla ${table}:`, error.message);
      }
    }
    
    // Verificar datos de ejemplo
    try {
      const [surveys] = await pool.execute('SELECT COUNT(*) as count FROM surveys');
      const [options] = await pool.execute('SELECT COUNT(*) as count FROM survey_options');
      const [votes] = await pool.execute('SELECT COUNT(*) as count FROM survey_votes');
      
      console.log(`📊 Datos de ejemplo:`);
      console.log(`   - Encuestas: ${surveys[0].count}`);
      console.log(`   - Opciones: ${options[0].count}`);
      console.log(`   - Votos: ${votes[0].count}`);
    } catch (error) {
      console.error('❌ Error verificando datos:', error.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error configurando sistema de encuestas:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupSurveysDatabase()
    .then(success => {
      if (success) {
        console.log('🎉 Configuración completada exitosamente');
        process.exit(0);
      } else {
        console.error('💥 Error en la configuración');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = setupSurveysDatabase; 