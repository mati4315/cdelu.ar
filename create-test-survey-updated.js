const pool = require('./src/config/database');

async function createTestSurveyUpdated() {
  console.log('➕ Creando encuesta de prueba con esquema actualizado...');
  
  try {
    // Crear encuesta
    const [surveyResult] = await pool.execute(
      `INSERT INTO surveys (question, is_multiple_choice, max_votes_per_user, created_by, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        '¿Cuál es tu color favorito?',
        false, // No es múltiple choice
        1, // 1 voto por usuario
        3, // ID del usuario administrador
        new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira en 24 horas
      ]
    );
    
    const surveyId = surveyResult.insertId;
    console.log(`✅ Encuesta creada con ID: ${surveyId}`);
    
    // Crear opciones
    const options = ['Rojo', 'Azul', 'Verde', 'Amarillo'];
    
    for (let i = 0; i < options.length; i++) {
      await pool.execute(
        'INSERT INTO survey_options (survey_id, option_text, display_order) VALUES (?, ?, ?)',
        [surveyId, options[i], i + 1]
      );
      console.log(`✅ Opción creada: ${options[i]}`);
    }
    
    // Verificar que se creó correctamente
    const [surveys] = await pool.execute(
      'SELECT * FROM surveys WHERE id = ?',
      [surveyId]
    );
    
    if (surveys.length > 0) {
      const survey = surveys[0];
      console.log('\n✅ Encuesta creada exitosamente:');
      console.log(`   - ID: ${survey.id}`);
      console.log(`   - Pregunta: "${survey.question}"`);
      console.log(`   - Estado: ${survey.status}`);
      console.log(`   - Múltiple choice: ${survey.is_multiple_choice ? 'Sí' : 'No'}`);
      console.log(`   - Max votos por usuario: ${survey.max_votes_per_user}`);
    }
    
    // Verificar opciones
    const [optionsResult] = await pool.execute(
      'SELECT * FROM survey_options WHERE survey_id = ? ORDER BY display_order',
      [surveyId]
    );
    
    console.log('\n✅ Opciones creadas:');
    optionsResult.forEach((option, index) => {
      console.log(`   ${index + 1}. ${option.option_text} (ID: ${option.id})`);
    });
    
    console.log(`\n🎉 Encuesta de prueba creada con ID: ${surveyId}`);
    console.log('💡 Usa este ID para las pruebas: ' + surveyId);
    
  } catch (error) {
    console.error('❌ Error creando encuesta:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestSurveyUpdated()
    .then(() => {
      console.log('\n🏁 Creación de encuesta completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createTestSurveyUpdated; 