const axios = require('axios');

/**
 * Script para crear una encuesta de prueba y verificar el estado para usuarios invitados
 */

const BASE_URL = 'http://localhost:3001/api/v1';

// Token de admin (debes obtenerlo del login de admin)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhZG1pbi5jb20iLCJyb2wiOiJhZG1pbiIsImlhdCI6MTc1NDQ4NjgzNiwiZXhwIjoxNzU0NTczMjM2fQ.3m6VxNbLa_eIcpywm6qGJEaS8GBWfqYpEb9_7z2u5Fg';

async function createTestSurveyAndVerify() {
  console.log('🧪 CREAR ENCUESTA Y VERIFICAR ESTADO PARA USUARIOS INVITADOS');
  console.log('============================================================');
  
  try {
    // 1. Crear una encuesta de prueba
    console.log('\n🔧 1. Creando encuesta de prueba...');
    
    const surveyData = {
      question: '¿Te gusta el sistema de encuestas actualizado?',
      options: [
        'Sí, me encanta',
        'Está bien',
        'No me gusta',
        'Necesita mejoras'
      ],
      is_multiple_choice: false,
      max_votes_per_user: 1
    };
    
    const createResponse = await axios.post(`${BASE_URL}/surveys`, surveyData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Encuesta creada:', createResponse.data);
    const surveyId = createResponse.data.data.id;
    
    // 2. Esperar un momento para que se procese
    console.log('\n⏳ Esperando que la encuesta esté disponible...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Verificar como usuario invitado
    console.log('\n👤 2. Verificando como usuario invitado (sin token)...');
    
    const guestResponse = await axios.get(`${BASE_URL}/surveys/active?limit=5`, {
      headers: {
        'Content-Type': 'application/json'
        // Sin Authorization header - usuario invitado
      }
    });
    
    console.log('✅ Respuesta para usuario invitado:', guestResponse.status);
    console.log('📊 Encuestas encontradas:', guestResponse.data.data.length);
    
    // 4. Analizar el estado de la encuesta
    if (guestResponse.data.success && guestResponse.data.data.length > 0) {
      console.log('\n🎯 ANÁLISIS DE ESTADOS:');
      
      guestResponse.data.data.forEach((survey, index) => {
        console.log(`\n📋 Encuesta ${index + 1} (ID: ${survey.id}):`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   has_voted: ${survey.has_voted}`);
        console.log(`   show_options: ${survey.show_options}`);
        console.log(`   Total opciones: ${survey.options ? survey.options.length : 0}`);
        
        // Verificar estado esperado para usuario invitado
        if (survey.has_voted === false && survey.show_options === true) {
          console.log('   ✅ CORRECTO: Usuario invitado ve estado 0 (opciones)');
        } else {
          console.log('   ❌ ERROR: Usuario invitado ve estado incorrecto');
          console.log(`      Esperado: has_voted=false, show_options=true`);
          console.log(`      Recibido: has_voted=${survey.has_voted}, show_options=${survey.show_options}`);
        }
        
        // Mostrar opciones disponibles
        if (survey.options && survey.options.length > 0) {
          console.log('   📋 Opciones disponibles:');
          survey.options.forEach((option, i) => {
            console.log(`      ${i + 1}. ${option.option_text} (${option.votes_count} votos)`);
          });
        }
      });
      
      // 5. Resultado final
      const allCorrect = guestResponse.data.data.every(survey => 
        survey.has_voted === false && survey.show_options === true
      );
      
      console.log('\n🎯 RESULTADO FINAL:');
      if (allCorrect) {
        console.log('✅ ÉXITO: La corrección funciona correctamente');
        console.log('✅ Usuarios invitados ven estado 0 (opciones para votar)');
        console.log('✅ Pueden ver la encuesta y decidir registrarse');
      } else {
        console.log('❌ FALLO: La corrección NO funciona');
        console.log('❌ Usuarios invitados siguen viendo estado incorrecto');
      }
      
    } else {
      console.log('⚠️  No se encontraron encuestas activas');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('   Estado HTTP:', error.response.status);
      console.error('   Respuesta:', error.response.data);
    }
  }
}

// Ejecutar la prueba
createTestSurveyAndVerify(); 