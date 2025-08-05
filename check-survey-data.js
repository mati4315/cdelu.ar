const pool = require('./src/config/database');

async function checkSurveyData() {
  console.log('🔍 Verificando datos de encuestas...');
  
  try {
    // 1. Verificar encuestas
    console.log('1️⃣ Verificando encuestas...');
    const [surveys] = await pool.execute('SELECT * FROM surveys');
    console.log(`📊 Encuestas encontradas: ${surveys.length}`);
    
    surveys.forEach((survey, index) => {
      console.log(`   ${index + 1}. ID: ${survey.id}, Título: "${survey.title}", Estado: ${survey.status}`);
    });
    
    // 2. Verificar opciones
    console.log('\n2️⃣ Verificando opciones...');
    const [options] = await pool.execute('SELECT * FROM survey_options ORDER BY survey_id, display_order');
    console.log(`📊 Opciones encontradas: ${options.length}`);
    
    options.forEach((option, index) => {
      console.log(`   ${index + 1}. ID: ${option.id}, Survey: ${option.survey_id}, Texto: "${option.option_text}", Votos: ${option.votes_count}`);
    });
    
    // 3. Verificar votos
    console.log('\n3️⃣ Verificando votos...');
    const [votes] = await pool.execute('SELECT * FROM survey_votes');
    console.log(`📊 Votos encontrados: ${votes.length}`);
    
    votes.forEach((vote, index) => {
      console.log(`   ${index + 1}. Survey: ${vote.survey_id}, Opción: ${vote.option_id}, IP: ${vote.user_ip}, Usuario: ${vote.user_id || 'Anónimo'}`);
    });
    
    // 4. Verificar estadísticas
    console.log('\n4️⃣ Verificando estadísticas...');
    const [stats] = await pool.execute('SELECT * FROM survey_stats');
    console.log(`📊 Estadísticas encontradas: ${stats.length}`);
    
    stats.forEach((stat, index) => {
      console.log(`   ${index + 1}. Survey: ${stat.survey_id}, Total votos: ${stat.total_votes}, Votantes únicos: ${stat.unique_voters}`);
    });
    
    // 5. Verificar triggers
    console.log('\n5️⃣ Verificando triggers...');
    const [triggers] = await pool.execute("SHOW TRIGGERS LIKE 'survey%'");
    console.log(`📊 Triggers encontrados: ${triggers.length}`);
    
    triggers.forEach((trigger, index) => {
      console.log(`   ${index + 1}. ${trigger.Trigger}: ${trigger.Timing} ${trigger.Event} ON ${trigger.Table}`);
    });
    
    // 6. Verificar restricciones únicas
    console.log('\n6️⃣ Verificando restricciones únicas...');
    const [constraints] = await pool.execute(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE 'survey%'
      AND CONSTRAINT_NAME LIKE '%unique%'
    `);
    
    console.log(`📊 Restricciones únicas encontradas: ${constraints.length}`);
    constraints.forEach((constraint, index) => {
      console.log(`   ${index + 1}. Tabla: ${constraint.TABLE_NAME}, Restricción: ${constraint.CONSTRAINT_NAME}, Columna: ${constraint.COLUMN_NAME}`);
    });
    
    console.log('\n✅ Verificación de datos completada');
    
    // 7. Resumen final
    console.log('\n📋 RESUMEN:');
    console.log(`   - Encuestas: ${surveys.length}`);
    console.log(`   - Opciones: ${options.length}`);
    console.log(`   - Votos: ${votes.length}`);
    console.log(`   - Estadísticas: ${stats.length}`);
    console.log(`   - Triggers: ${triggers.length}`);
    console.log(`   - Restricciones únicas: ${constraints.length}`);
    
    if (surveys.length === 0) {
      console.log('\n⚠️ ADVERTENCIA: No hay encuestas en la base de datos');
      console.log('💡 Ejecuta: node create-surveys-direct.js');
    }
    
    if (options.length === 0) {
      console.log('\n⚠️ ADVERTENCIA: No hay opciones en la base de datos');
      console.log('💡 Ejecuta: node check-survey-id.js');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSurveyData()
    .then(success => {
      if (success) {
        console.log('\n🎉 Verificación completada exitosamente');
        process.exit(0);
      } else {
        console.error('💥 Error en la verificación');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = checkSurveyData; 