const axios = require('axios');

/**
 * Script para verificar que usuarios invitados/nuevos vean estado 0 en encuestas
 */

const BASE_URL = 'http://localhost:3001/api/v1';

async function testGuestUserSurveyState() {
  console.log('🧪 PRUEBA: Estado de encuestas para usuarios invitados');
  console.log('========================================');
  
  try {
    // 1. Llamar al endpoint de encuestas activas SIN token (como usuario invitado)
    console.log('\n🔍 1. Obteniendo encuestas como usuario invitado (sin token)...');
    
    const response = await axios.get(`${BASE_URL}/surveys/active?limit=3`, {
      headers: {
        'Content-Type': 'application/json'
        // Sin Authorization header - usuario invitado
      }
    });
    
    console.log('✅ Respuesta recibida:', response.status);
    console.log('📊 Datos:', JSON.stringify(response.data, null, 2));
    
    // 2. Verificar que las encuestas tienen el estado correcto
    if (response.data.success && response.data.data.length > 0) {
      console.log('\n🎯 ANÁLISIS DE ESTADOS:');
      
      response.data.data.forEach((survey, index) => {
        console.log(`\n📋 Encuesta ${index + 1} (ID: ${survey.id}):`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   has_voted: ${survey.has_voted}`);
        console.log(`   show_options: ${survey.show_options}`);
        console.log(`   Total opciones: ${survey.options ? survey.options.length : 0}`);
        
        // Verificar estado esperado para usuario invitado
        if (survey.has_voted === false && survey.show_options === true) {
          console.log('   ✅ CORRECTO: Usuario invitado ve estado 0 (opciones)');
        } else {
          console.log('   ❌ ERROR: Usuario invitado NO ve estado 0');
          console.log(`      Esperado: has_voted=false, show_options=true`);
          console.log(`      Recibido: has_voted=${survey.has_voted}, show_options=${survey.show_options}`);
        }
      });
      
      // 3. Verificar comportamiento general
      const allCorrect = response.data.data.every(survey => 
        survey.has_voted === false && survey.show_options === true
      );
      
      console.log('\n🎯 RESULTADO FINAL:');
      if (allCorrect) {
        console.log('✅ ÉXITO: Todos los usuarios invitados ven estado 0 correctamente');
        console.log('✅ Los usuarios pueden ver las opciones y decidir registrarse');
      } else {
        console.log('❌ FALLO: Algunos usuarios invitados ven estado incorrecto');
        console.log('❌ Esto puede impedir que se registren para votar');
      }
      
    } else {
      console.log('⚠️  No hay encuestas activas para probar');
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
testGuestUserSurveyState(); 