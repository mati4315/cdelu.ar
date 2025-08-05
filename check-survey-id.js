const pool = require('./src/config/database');

async function checkSurveyId() {
  console.log('🔍 Verificando ID de encuesta...');
  
  try {
    // Verificar encuestas existentes
    const [surveys] = await pool.execute('SELECT id, title FROM surveys');
    console.log('📋 Encuestas existentes:');
    surveys.forEach(survey => {
      console.log(`   - ID: ${survey.id}, Título: "${survey.title}"`);
    });
    
    if (surveys.length > 0) {
      const surveyId = surveys[0].id;
      console.log(`\n🎯 Usando encuesta ID: ${surveyId}`);
      
      // Crear opciones para esta encuesta
      console.log('📝 Creando opciones...');
      await pool.execute(`
        INSERT INTO survey_options (survey_id, option_text, display_order) VALUES
        (?, 'Rojo', 1),
        (?, 'Azul', 2),
        (?, 'Verde', 3),
        (?, 'Amarillo', 4)
      `, [surveyId, surveyId, surveyId, surveyId]);
      console.log('✅ Opciones creadas');
      
      // Verificar opciones
      const [options] = await pool.execute('SELECT id, option_text, display_order FROM survey_options WHERE survey_id = ? ORDER BY display_order', [surveyId]);
      console.log('📋 Opciones creadas:');
      options.forEach(option => {
        console.log(`   - ID ${option.id}: ${option.option_text} (orden: ${option.display_order})`);
      });
      
      console.log(`\n✅ Encuesta ID ${surveyId} lista para votar`);
      console.log('🎯 El frontend puede usar esta encuesta para pruebas');
      
    } else {
      console.log('❌ No hay encuestas disponibles');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando encuesta:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSurveyId()
    .then(success => {
      if (success) {
        console.log('🎉 Verificación completada');
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

module.exports = checkSurveyId; 