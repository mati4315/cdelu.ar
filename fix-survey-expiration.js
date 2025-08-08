const pool = require('./src/config/database');
const axios = require('axios');

async function fixSurveyAndTest() {
  console.log('🔧 CORRIGIENDO FECHA DE EXPIRACIÓN Y PROBANDO');
  console.log('=============================================');
  
  try {
    // 1. Actualizar fecha de expiración de la encuesta 33
    console.log('\n⏰ 1. Corrigiendo fecha de expiración...');
    
    // Establecer expiración para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await pool.execute(
      'UPDATE surveys SET expires_at = ? WHERE id = 33',
      [tomorrow]
    );
    
    console.log('✅ Fecha de expiración actualizada para mañana');
    
    // 2. Verificar que la encuesta ahora aparece como activa
    console.log('\n📊 2. Verificando encuestas activas en API...');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
    
    // Probar como usuario invitado
    const response = await axios.get('http://localhost:3001/api/v1/surveys/active?limit=3', {
      headers: {
        'Content-Type': 'application/json'
        // Sin Authorization - usuario invitado
      }
    });
    
    console.log('✅ Respuesta API:', response.status);
    console.log('📊 Encuestas encontradas:', response.data.data.length);
    
    if (response.data.success && response.data.data.length > 0) {
      console.log('\n🎯 ANÁLISIS DEL ESTADO CORREGIDO:');
      
      response.data.data.forEach((survey, index) => {
        console.log(`\n📋 Encuesta ${index + 1} (ID: ${survey.id}):`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   has_voted: ${survey.has_voted}`);
        console.log(`   show_options: ${survey.show_options}`);
        console.log(`   Total opciones: ${survey.options ? survey.options.length : 0}`);
        console.log(`   Total votos: ${survey.total_votes}`);
        
        // Verificar estado esperado para usuario invitado
        if (survey.has_voted === false && survey.show_options === true) {
          console.log('   ✅ PERFECTO: Usuario invitado ve estado 0 (opciones)');
          console.log('   ✅ Puede ver la encuesta y decidir registrarse para votar');
        } else {
          console.log('   ❌ ERROR: Usuario invitado ve estado incorrecto');
          console.log(`      Esperado: has_voted=false, show_options=true`);
          console.log(`      Recibido: has_voted=${survey.has_voted}, show_options=${survey.show_options}`);
        }
        
        // Mostrar opciones
        if (survey.options && survey.options.length > 0) {
          console.log('   📋 Opciones que ve el usuario invitado:');
          survey.options.forEach((option, i) => {
            console.log(`      ${i + 1}. "${option.option_text}" - ${option.votes_count} votos (${option.percentage}%)`);
          });
        }
      });
      
      // Resultado final
      const allCorrect = response.data.data.every(survey => 
        survey.has_voted === false && survey.show_options === true
      );
      
      console.log('\n🎯 RESULTADO DE LA CORRECCIÓN:');
      if (allCorrect) {
        console.log('🎉 ¡ÉXITO TOTAL! La corrección funciona perfectamente');
        console.log('✅ Usuarios invitados ahora ven estado 0 (opciones para votar)');
        console.log('✅ Pueden ver las encuestas y decidir registrarse');
        console.log('✅ Ya no ven estado 1 (resultados) por error');
        console.log('\n🔥 EL PROBLEMA ESTÁ RESUELTO 🔥');
      } else {
        console.log('❌ La corrección no funcionó completamente');
        console.log('❌ Revisar lógica del controlador');
      }
      
    } else {
      console.log('⚠️  Aún no hay encuestas activas disponibles');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Estado HTTP:', error.response.status);
      console.error('   Respuesta:', error.response.data);
    }
  } finally {
    await pool.end();
  }
}

fixSurveyAndTest(); 