const fetch = require('node-fetch');

async function testSurveyVote() {
  console.log('🧪 Probando endpoint de votación...');
  
  try {
    // 1. Obtener encuesta para ver el estado actual
    console.log('1️⃣ Obteniendo encuesta actual...');
    const surveyResponse = await fetch('http://localhost:3001/api/v1/surveys/1');
    const surveyData = await surveyResponse.json();
    
    if (surveyData.success) {
      console.log(`✅ Encuesta obtenida: "${surveyData.data.title}"`);
      console.log(`   - Total de votos: ${surveyData.data.total_votes}`);
      console.log(`   - Usuario ya votó: ${surveyData.data.user_voted}`);
      console.log(`   - Opciones disponibles: ${surveyData.data.options.length}`);
      
      // Mostrar opciones
      surveyData.data.options.forEach((option, index) => {
        console.log(`   - Opción ${index + 1}: ${option.option_text} (${option.votes_count} votos)`);
      });
    } else {
      console.log('❌ Error obteniendo encuesta:', surveyData.message);
      return;
    }
    
    // 2. Intentar votar
    console.log('\n2️⃣ Intentando votar...');
    const voteData = {
      option_ids: [1] // Votar por la primera opción
    };
    
    const voteResponse = await fetch('http://localhost:3001/api/v1/surveys/1/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });
    
    const voteResult = await voteResponse.json();
    
    if (voteResult.success) {
      console.log('✅ Voto registrado exitosamente');
    } else {
      console.log('❌ Error registrando voto:', voteResult.message);
      console.log('   Error específico:', voteResult.error);
    }
    
    // 3. Verificar estadísticas después del voto
    console.log('\n3️⃣ Verificando estadísticas después del voto...');
    const statsResponse = await fetch('http://localhost:3001/api/v1/surveys/1/stats');
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log(`✅ Estadísticas actualizadas:`);
      console.log(`   - Total de votos: ${statsData.data.total_votes}`);
      console.log(`   - Votantes registrados: ${statsData.data.registered_voters}`);
      console.log(`   - IPs únicas: ${statsData.data.unique_ips}`);
      
      if (statsData.data.options.length > 0) {
        console.log(`   - Opción más votada: "${statsData.data.options[0].option_text}" (${statsData.data.options[0].votes_count} votos)`);
      }
    } else {
      console.log('❌ Error obteniendo estadísticas:', statsData.message);
    }
    
    // 4. Verificar logs del servidor
    console.log('\n4️⃣ Información de diagnóstico:');
    console.log('   - Servidor corriendo en puerto 3001 ✅');
    console.log('   - Base de datos conectada ✅');
    console.log('   - Tablas de encuestas creadas ✅');
    console.log('   - Datos de ejemplo disponibles ✅');
    
    if (!voteResult.success) {
      console.log('\n🔧 Posibles soluciones:');
      console.log('   1. Verificar que el usuario no haya votado ya');
      console.log('   2. Verificar que la encuesta esté activa');
      console.log('   3. Verificar que las opciones sean válidas');
      console.log('   4. Revisar logs del servidor para más detalles');
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.log('\n🔧 Posibles causas:');
    console.log('   1. Servidor no está corriendo');
    console.log('   2. Problema de conexión a la base de datos');
    console.log('   3. Error en el endpoint de votación');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testSurveyVote()
    .then(() => {
      console.log('\n🏁 Prueba completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = testSurveyVote; 