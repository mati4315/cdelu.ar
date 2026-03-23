const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBinaryStateSurveys() {
  try {
    console.log('🧪 Probando sistema de estado binario para encuestas...\n');
    
    // Probar endpoint GET /surveys/active sin autenticación
    console.log('📡 GET /api/v1/surveys/active (sin autenticación)');
    const response = await axios.get(`${BASE_URL}/api/v1/surveys/active`);
    
    if (response.data.success) {
      console.log('✅ Endpoint funcionando correctamente');
      console.log(`📊 Encuestas encontradas: ${response.data.data.length}`);
      
      response.data.data.forEach((survey, index) => {
        console.log(`\n📝 Encuesta ${index + 1}:`);
        console.log(`   ID: ${survey.id}`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   Votos totales: ${survey.total_votes}`);
        console.log(`   Has Voted: ${survey.has_voted}`);
        console.log(`   Show Options: ${survey.show_options}`);
        console.log(`   Opciones:`);
        
        survey.options.forEach((option, optIndex) => {
          const percentage = option.percentage || 0;
          console.log(`      ${optIndex + 1}. "${option.option_text}" - ${option.votes_count} votos (${percentage}%)`);
        });
      });
    } else {
      console.log('❌ Error en la respuesta:', response.data);
    }
    
    // Probar endpoint GET /surveys/active con autenticación
    console.log('\n📡 GET /api/v1/surveys/active (con autenticación)');
    
    // Simular un usuario autenticado (necesitarías un token válido)
    const authResponse = await axios.get(`${BASE_URL}/api/v1/surveys/active`, {
      headers: {
        'Authorization': 'Bearer test-token' // Esto fallará pero nos dará información
      }
    });
    
    console.log('✅ Respuesta con autenticación recibida');
    
    // Probar endpoint de votación
    if (response.data.data.length > 0) {
      const firstSurvey = response.data.data[0];
      console.log(`\n📡 POST /api/v1/surveys/${firstSurvey.id}/vote`);
      
      try {
        const voteResponse = await axios.post(`${BASE_URL}/api/v1/surveys/${firstSurvey.id}/vote`, {
          option_ids: [firstSurvey.options[0].id]
        }, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        if (voteResponse.data.success) {
          console.log('✅ Voto registrado correctamente');
          console.log(`   Survey ID: ${voteResponse.data.data.survey_id}`);
          console.log(`   Has Voted: ${voteResponse.data.data.has_voted}`);
          console.log(`   Show Options: ${voteResponse.data.data.show_options}`);
        }
      } catch (voteError) {
        console.log('⚠️ Error al votar (esperado sin token válido):', voteError.response?.data?.message || voteError.message);
      }
    }
    
    console.log('\n✅ Prueba del sistema de estado binario completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

testBinaryStateSurveys(); 