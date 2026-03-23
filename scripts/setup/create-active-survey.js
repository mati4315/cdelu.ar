const pool = require('./src/config/database');

async function createActiveSurvey() {
  console.log('➕ Creando encuesta activa sin fecha de expiración...');
  
  try {
    // Crear encuesta activa que no expire
    const [surveyResult] = await pool.execute(
      `INSERT INTO surveys (question, is_multiple_choice, max_votes_per_user, created_by, status, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        '¿Cuál es tu deporte favorito?',
        false, // No es múltiple choice
        1, // 1 voto por usuario
        3, // ID del usuario administrador
        'active', // Estado activo
        null // Sin fecha de expiración
      ]
    );
    
    const surveyId = surveyResult.insertId;
    console.log(`✅ Encuesta activa creada con ID: ${surveyId}`);
    
    // Crear opciones
    const options = ['Fútbol', 'Basketball', 'Tenis', 'Natación', 'Atletismo'];
    
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
      console.log('\n✅ Encuesta activa creada exitosamente:');
      console.log(`   - ID: ${survey.id}`);
      console.log(`   - Pregunta: "${survey.question}"`);
      console.log(`   - Estado: ${survey.status}`);
      console.log(`   - Expira: ${survey.expires_at || 'No expira'}`);
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
    
    console.log(`\n🎉 Encuesta activa creada con ID: ${surveyId}`);
    console.log('💡 Esta encuesta debería aparecer en /surveys/active');
    
  } catch (error) {
    console.error('❌ Error creando encuesta activa:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createActiveSurvey()
    .then(() => {
      console.log('\n🏁 Creación de encuesta activa completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createActiveSurvey; 