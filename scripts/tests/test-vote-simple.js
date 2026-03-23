const fetch = require('node-fetch');

async function testVoteSimple() {
  console.log('🧪 Probando endpoint de votación...');
  
  try {
    // 1. Obtener encuesta para ver el estado actual
    console.log('1️⃣ Obteniendo encuesta ID 3...');
    const surveyResponse = await fetch('http://localhost:3001/api/v1/surveys/3');
    
    if (!surveyResponse.ok) {
      console.error(`❌ Error HTTP: ${surveyResponse.status} ${surveyResponse.statusText}`);
      return;
    }
    
    const surveyData = await surveyResponse.json();
    
    if (surveyData.success) {
      console.log(`✅ Encuesta obtenida: "${surveyData.data.title}"`);
      console.log(`   - Total de votos: ${surveyData.data.total_votes}`);
      console.log(`   - Usuario ya votó: ${surveyData.data.user_voted}`);
      console.log(`   - Opciones disponibles: ${surveyData.data.options.length}`);
      
      // Mostrar opciones
      surveyData.data.options.forEach((option, index) => {
        console.log(`   - Opción ${index + 1}: ${option.option_text} (ID: ${option.id})`);
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
    console.log(`   Datos enviados:`, JSON.stringify(voteData, null, 2));
    
    const voteResponse = await fetch('http://localhost:3001/api/v1/surveys/3/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });
    
    console.log(`   Status Code: ${voteResponse.status}`);
    console.log(`   Status Text: ${voteResponse.statusText}`);
    
    const voteResult = await voteResponse.json();
    console.log(`   Response:`, JSON.stringify(voteResult, null, 2));
    
    if (voteResult.success) {
      console.log('✅ Voto registrado exitosamente');
    } else {
      console.log('❌ Error registrando voto:', voteResult.message);
      console.log('   Error específico:', voteResult.error);
    }
    
    // 3. Verificar encuesta después del voto
    console.log('\n3️⃣ Verificando encuesta después del voto...');
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
    
    // 4. Diagnóstico final
    console.log('\n4️⃣ Diagnóstico:');
    if (voteResult.success) {
      console.log('✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
      console.log('🎉 El endpoint de votación está operativo');
    } else {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log(`   - Status Code: ${voteResponse.status}`);
      console.log(`   - Error: ${voteResult.error}`);
      console.log(`   - Mensaje: ${voteResult.message}`);
      
      if (voteResponse.status === 500) {
        console.log('🔧 Posibles causas del error 500:');
        console.log('   1. Problema en la base de datos');
        console.log('   2. Error en los triggers');
        console.log('   3. Restricción única violada');
        console.log('   4. Error en el controlador');
      }
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.log('\n🔧 Posibles causas:');
    console.log('   1. Servidor no está corriendo');
    console.log('   2. Problema de conexión');
    console.log('   3. Error en el endpoint');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testVoteSimple()
    .then(() => {
      console.log('\n🏁 Prueba completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = testVoteSimple; 