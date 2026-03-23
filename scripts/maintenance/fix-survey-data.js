const pool = require('./src/config/database');

async function fixSurveyData() {
  console.log('🔧 Arreglando datos de encuestas...');
  
  try {
    // 1. Limpiar datos existentes
    console.log('1️⃣ Limpiando datos existentes...');
    await pool.execute('DELETE FROM survey_votes');
    await pool.execute('DELETE FROM survey_options');
    await pool.execute('DELETE FROM survey_stats');
    await pool.execute('DELETE FROM surveys');
    console.log('✅ Datos limpiados');
    
    // 2. Crear encuesta limpia
    console.log('2️⃣ Creando encuesta limpia...');
    await pool.execute(`
      INSERT INTO surveys (title, description, question, status, is_multiple_choice, max_votes_per_user, created_by) 
      VALUES (
        'Encuesta de Prueba',
        'Esta es una encuesta de prueba para el frontend',
        '¿Cuál es tu color favorito?',
        'active',
        FALSE,
        1,
        1
      )
    `);
    console.log('✅ Encuesta creada');
    
    // 3. Crear opciones únicas
    console.log('3️⃣ Creando opciones únicas...');
    await pool.execute(`
      INSERT INTO survey_options (survey_id, option_text, display_order) VALUES
      (1, 'Rojo', 1),
      (1, 'Azul', 2),
      (1, 'Verde', 3),
      (1, 'Amarillo', 4)
    `);
    console.log('✅ Opciones creadas');
    
    // 4. Verificar datos
    console.log('4️⃣ Verificando datos...');
    const [surveys] = await pool.execute('SELECT COUNT(*) as count FROM surveys');
    const [options] = await pool.execute('SELECT COUNT(*) as count FROM survey_options');
    const [votes] = await pool.execute('SELECT COUNT(*) as count FROM survey_votes');
    
    console.log(`📊 Datos verificados:`);
    console.log(`   - Encuestas: ${surveys[0].count}`);
    console.log(`   - Opciones: ${options[0].count}`);
    console.log(`   - Votos: ${votes[0].count}`);
    
    // 5. Mostrar opciones creadas
    const [optionsList] = await pool.execute('SELECT id, option_text, display_order FROM survey_options ORDER BY display_order');
    console.log('📋 Opciones disponibles:');
    optionsList.forEach(option => {
      console.log(`   - ID ${option.id}: ${option.option_text} (orden: ${option.display_order})`);
    });
    
    console.log('✅ Datos de encuestas arreglados correctamente');
    console.log('🎯 Ahora el frontend debería poder votar sin problemas');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error arreglando datos:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixSurveyData()
    .then(success => {
      if (success) {
        console.log('🎉 Datos arreglados exitosamente');
        process.exit(0);
      } else {
        console.error('💥 Error arreglando los datos');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = fixSurveyData; 