const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function verifyBackendResponse() {
  try {
    console.log('🔍 Verificando respuesta exacta del backend...\n');
    
    // 1. Probar endpoint GET /surveys/active
    console.log('📡 GET /api/v1/surveys/active');
    const response = await axios.get(`${BASE_URL}/api/v1/surveys/active`);
    
    if (response.data.success) {
      console.log('✅ Endpoint funcionando correctamente');
      console.log(`📊 Encuestas encontradas: ${response.data.data.length}`);
      
      response.data.data.forEach((survey, index) => {
        console.log(`\n📝 Encuesta ${index + 1}:`);
        console.log(`   ID: ${survey.id}`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   Total Votes: ${survey.total_votes}`);
        console.log(`   Has Voted: ${survey.has_voted}`);
        console.log(`   Show Options: ${survey.show_options}`);
        
        console.log(`   📋 Opciones:`);
        survey.options.forEach((option, optIndex) => {
          console.log(`      ${optIndex + 1}. ID: ${option.id}`);
          console.log(`         Texto: "${option.option_text}"`);
          console.log(`         Votes Count: ${option.votes_count}`);
          console.log(`         Percentage: ${option.percentage}`);
          console.log(`         Display Order: ${option.display_order}`);
          
          // Verificar si los campos críticos están presentes
          const hasVotesCount = 'votes_count' in option;
          const hasPercentage = 'percentage' in option;
          const votesCountType = typeof option.votes_count;
          const percentageType = typeof option.percentage;
          
          console.log(`         ✅ Votes Count presente: ${hasVotesCount} (tipo: ${votesCountType})`);
          console.log(`         ✅ Percentage presente: ${hasPercentage} (tipo: ${percentageType})`);
          
          if (!hasVotesCount) {
            console.log(`         ❌ PROBLEMA: votes_count no está presente`);
          }
          if (!hasPercentage) {
            console.log(`         ❌ PROBLEMA: percentage no está presente`);
          }
          if (option.votes_count === undefined || option.votes_count === null) {
            console.log(`         ❌ PROBLEMA: votes_count es ${option.votes_count}`);
          }
          if (option.percentage === undefined || option.percentage === null) {
            console.log(`         ❌ PROBLEMA: percentage es ${option.percentage}`);
          }
        });
      });
      
      // 2. Probar endpoint GET /surveys/:id para la primera encuesta
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
          console.log(`   Total Votes: ${survey.total_votes}`);
          console.log(`   Has Voted: ${survey.has_voted}`);
          console.log(`   Show Options: ${survey.show_options}`);
          
          console.log(`   📋 Opciones:`);
          survey.options.forEach((option, optIndex) => {
            console.log(`      ${optIndex + 1}. ID: ${option.id}`);
            console.log(`         Texto: "${option.option_text}"`);
            console.log(`         Votes Count: ${option.votes_count}`);
            console.log(`         Percentage: ${option.percentage}`);
            
            // Verificar campos críticos
            const hasVotesCount = 'votes_count' in option;
            const hasPercentage = 'percentage' in option;
            
            console.log(`         ✅ Votes Count presente: ${hasVotesCount}`);
            console.log(`         ✅ Percentage presente: ${hasPercentage}`);
          });
        } else {
          console.log('❌ Error en la respuesta del detalle:', detailResponse.data);
        }
      }
      
      // 3. Mostrar respuesta JSON completa para debugging
      console.log('\n🔍 Respuesta JSON completa del backend:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } else {
      console.log('❌ Error en la respuesta:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

verifyBackendResponse(); 