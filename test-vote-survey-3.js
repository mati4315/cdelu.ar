const fetch = require('node-fetch');

async function testVoteSurvey3() {
  console.log('🧪 Probando votación en encuesta ID 3...');
  
  try {
    // 1. Obtener encuesta ID 3
    console.log('1️⃣ Obteniendo encuesta ID 3...');
    const surveyResponse = await fetch('http://localhost:3001/api/v1/surveys/3');
    const surveyData = await surveyResponse.json();
    
    if (surveyData.success) {
      console.log(`✅ Encuesta obtenida: "${surveyData.data.title}"`);
      console.log(`   - Total de votos: ${surveyData.data.total_votes}`);
      console.log(`   - Usuario ya votó: ${surveyData.data.user_voted}`);
      console.log(`   - Opciones disponibles: ${surveyData.data.options.length}`);
      
      // Mostrar opciones
      surveyData.data.options.forEach((option, index) => {
        console.log(`   - Opción ${index + 1}: ${option.option_text} (ID: ${option.id}, ${option.votes_count} votos)`);
      });
    } else {
      console.log('❌ Error obteniendo encuesta:', surveyData.message);
      return;
    }
    
    // 2. Intentar votar
    console.log('\n2️⃣ Intentando votar...');
    const voteData = {
      option_ids: [surveyData.data.options[0].id] // Votar por la primera opción
    };
    
    console.log(`   Votando por opción ID: ${voteData.option_ids[0]}`);
    
    const voteResponse = await fetch('http://localhost:3001/api/v1/surveys/3/vote', {
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
    const statsResponse = await fetch('http://localhost:3001/api/v1/surveys/3/stats');
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
    
    // 4. Verificar encuesta actualizada
    console.log('\n4️⃣ Verificando encuesta actualizada...');
    const updatedSurveyResponse = await fetch('http://localhost:3001/api/v1/surveys/3');
    const updatedSurveyData = await updatedSurveyResponse.json();
    
    if (updatedSurveyData.success) {
      console.log(`✅ Encuesta actualizada:`);
      console.log(`   - Total de votos: ${updatedSurveyData.data.total_votes}`);
      console.log(`   - Usuario ya votó: ${updatedSurveyData.data.user_voted}`);
      
      updatedSurveyData.data.options.forEach((option, index) => {
        console.log(`   - Opción ${index + 1}: ${option.option_text} (${option.votes_count} votos)`);
      });
    }
    
    console.log('\n🎯 Resultado final:');
    if (voteResult.success) {
      console.log('✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
      console.log('🎉 El frontend puede usar la encuesta ID 3 para votar');
    } else {
      console.log('❌ Aún hay problemas con el sistema de votación');
      console.log('🔧 Revisar logs del servidor para más detalles');
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testVoteSurvey3()
    .then(() => {
      console.log('\n🏁 Prueba completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = testVoteSurvey3; 