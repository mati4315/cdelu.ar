const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testActiveEndpoint() {
  console.log('🧪 Probando endpoint /surveys/active...\n');

  try {
    // Probar obtener encuestas activas
    console.log('1️⃣ Probando GET /surveys/active...');
    const activeResponse = await axios.get(`${BASE_URL}/surveys/active?limit=10`);
    console.log('✅ Encuestas activas obtenidas correctamente');
    console.log(`📊 Encuestas encontradas: ${activeResponse.data.data?.length || 0}`);
    
    if (activeResponse.data.data?.length > 0) {
      console.log('\n📋 Encuestas activas:');
      activeResponse.data.data.forEach((survey, index) => {
        console.log(`   ${index + 1}. ID: ${survey.id}`);
        console.log(`      Pregunta: "${survey.question}"`);
        console.log(`      Estado: ${survey.status}`);
        console.log(`      Múltiple choice: ${survey.is_multiple_choice}`);
        console.log(`      Opciones: ${survey.options_count}`);
        console.log(`      Votos: ${survey.total_votes}`);
        
        if (survey.options && survey.options.length > 0) {
          console.log(`      Opciones disponibles:`);
          survey.options.forEach((option, optIndex) => {
            console.log(`         ${optIndex + 1}. ${option.option_text}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron encuestas activas');
    }

    // Probar obtener todas las encuestas para comparar
    console.log('2️⃣ Probando GET /surveys (todas las encuestas)...');
    const allSurveysResponse = await axios.get(`${BASE_URL}/surveys?status=active`);
    console.log(`📊 Todas las encuestas con estado "active": ${allSurveysResponse.data.data?.length || 0}`);
    
    if (allSurveysResponse.data.data?.length > 0) {
      console.log('\n📋 Todas las encuestas con estado "active":');
      allSurveysResponse.data.data.forEach((survey, index) => {
        console.log(`   ${index + 1}. ID: ${survey.id}, Pregunta: "${survey.question}", Estado: ${survey.status}`);
      });
    }

    console.log('\n🎉 Prueba del endpoint completada');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 Posibles problemas:');
      console.log('1. Verificar que el servidor esté corriendo');
      console.log('2. Verificar que no haya errores en el controlador');
      console.log('3. Verificar la base de datos');
    }
  }
}

testActiveEndpoint(); 