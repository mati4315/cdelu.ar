const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSurveyEndpoint() {
  try {
    console.log('🧪 Probando endpoint de encuestas activas...\n');
    
    // Probar endpoint GET /surveys/active
    console.log('📡 GET /api/v1/surveys/active');
    const response = await axios.get(`${BASE_URL}/api/v1/surveys/active`);
    
    if (response.data.success) {
      console.log('✅ Endpoint funcionando correctamente');
      console.log(`📊 Encuestas encontradas: ${response.data.data.length}`);
      
      response.data.data.forEach((survey, index) => {
        console.log(`\n📝 Encuesta ${index + 1}:`);
        console.log(`   ID: ${survey.id}`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   Votos totales: ${survey.total_votes}`);
        console.log(`   Opciones:`);
        
        survey.options.forEach((option, optIndex) => {
          const percentage = option.percentage || 0;
          console.log(`      ${optIndex + 1}. "${option.option_text}" - ${option.votes_count} votos (${percentage}%)`);
        });
      });
    } else {
      console.log('❌ Error en la respuesta:', response.data);
    }
    
    // Probar endpoint GET /surveys/:id para la primera encuesta
    if (response.data.data.length > 0) {
      const firstSurvey = response.data.data[0];
      console.log(`\n📡 GET /api/v1/surveys/${firstSurvey.id}`);
      
      const detailResponse = await axios.get(`${BASE_URL}/api/v1/surveys/${firstSurvey.id}`);
      
      if (detailResponse.data.success) {
        console.log('✅ Endpoint de detalle funcionando correctamente');
        const survey = detailResponse.data.data;
        console.log(`📊 Detalles de la encuesta:`);
        console.log(`   ID: ${survey.id}`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   Votos totales: ${survey.total_votes}`);
        console.log(`   Opciones:`);
        
        survey.options.forEach((option, optIndex) => {
          const percentage = option.percentage || 0;
          console.log(`      ${optIndex + 1}. "${option.option_text}" - ${option.votes_count} votos (${percentage}%)`);
        });
      } else {
        console.log('❌ Error en la respuesta del detalle:', detailResponse.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

testSurveyEndpoint(); 