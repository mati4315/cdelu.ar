const pool = require('./src/config/database');

async function checkSurveyOptions() {
  console.log('🔍 Verificando opciones de encuestas...\n');
  
  try {
    // Verificar todas las encuestas activas
    console.log('1️⃣ Encuestas activas:');
    const [activeSurveys] = await pool.execute(`
      SELECT id, question, status, expires_at 
      FROM surveys 
      WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY id
    `);
    
    console.log(`📊 Encuestas activas encontradas: ${activeSurveys.length}`);
    
    for (const survey of activeSurveys) {
      console.log(`\n📋 Encuesta ID: ${survey.id}`);
      console.log(`   Pregunta: "${survey.question}"`);
      console.log(`   Estado: ${survey.status}`);
      console.log(`   Expira: ${survey.expires_at || 'No expira'}`);
      
      // Obtener opciones de esta encuesta
      const [options] = await pool.execute(
        'SELECT id, option_text, display_order FROM survey_options WHERE survey_id = ? ORDER BY display_order, id',
        [survey.id]
      );
      
      console.log(`   Opciones (${options.length}):`);
      options.forEach((option, index) => {
        console.log(`     ${index + 1}. ID: ${option.id}, Texto: "${option.option_text}"`);
      });
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSurveyOptions()
    .then(() => {
      console.log('\n🏁 Verificación de opciones completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = checkSurveyOptions; 