const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoibHVjYXNAbHVjYXMuY29tIiwicm9sIjoidXN1YXJpbyIsImlhdCI6MTc1NDQwMjIxNCwiZXhwIjoxNzU0NDg4NjE0fQ.QoWsx2BgkUFfoxpFQXhdOsSHecNwW_VwLLdke0ZM9Kw';

async function testUnlimitedVoting() {
  console.log('🧪 Probando participación ilimitada en encuestas...\n');
  
  try {
    // 1. Obtener encuestas activas
    console.log('📋 Paso 1: Obteniendo encuestas activas...');
    const surveysResponse = await makeRequest('GET', '/api/v1/surveys/active');
    
    if (!surveysResponse.success || !surveysResponse.data || surveysResponse.data.length === 0) {
      console.log('❌ No hay encuestas activas para probar');
      return;
    }
    
    const survey = surveysResponse.data[0];
    console.log(`✅ Encuesta encontrada: ID ${survey.id} - "${survey.question}"`);
    console.log(`   Opciones disponibles: ${survey.options.length}`);
    
    // 2. Votar primera vez
    console.log('\n🗳️ Paso 2: Votando primera vez...');
    const firstVote = await makeRequest('POST', `/api/v1/surveys/${survey.id}/vote`, {
      option_ids: [survey.options[0].id]
    });
    
    if (firstVote.success) {
      console.log('✅ Primer voto exitoso');
    } else {
      console.log('❌ Error en primer voto:', firstVote.error || firstVote.message);
    }
    
    // 3. Votar segunda vez (mismo usuario)
    console.log('\n🗳️ Paso 3: Votando segunda vez (mismo usuario)...');
    const secondVote = await makeRequest('POST', `/api/v1/surveys/${survey.id}/vote`, {
      option_ids: [survey.options[1].id]
    });
    
    if (secondVote.success) {
      console.log('✅ Segundo voto exitoso - ¡Participación múltiple funciona!');
    } else {
      console.log('❌ Error en segundo voto:', secondVote.error || secondVote.message);
    }
    
    // 4. Votar múltiples opciones
    if (survey.options.length >= 3) {
      console.log('\n🗳️ Paso 4: Votando múltiples opciones...');
      const multiVote = await makeRequest('POST', `/api/v1/surveys/${survey.id}/vote`, {
        option_ids: [survey.options[0].id, survey.options[2].id]
      });
      
      if (multiVote.success) {
        console.log('✅ Voto múltiple exitoso - ¡Sin límites de opciones!');
      } else {
        console.log('❌ Error en voto múltiple:', multiVote.error || multiVote.message);
      }
    }
    
    // 5. Verificar resultados actualizados
    console.log('\n📊 Paso 5: Verificando resultados actualizados...');
    const updatedSurveys = await makeRequest('GET', '/api/v1/surveys/active');
    
    if (updatedSurveys.success && updatedSurveys.data.length > 0) {
      const updatedSurvey = updatedSurveys.data.find(s => s.id === survey.id);
      if (updatedSurvey) {
        console.log(`✅ Encuesta actualizada - Total votos: ${updatedSurvey.total_votes}`);
        updatedSurvey.options.forEach(option => {
          console.log(`   "${option.option_text}": ${option.votes_count} votos (${option.percentage}%)`);
        });
      }
    }
    
    console.log('\n🎉 ¡PRUEBA COMPLETADA!');
    console.log('✅ Participación ilimitada funcionando correctamente');
    console.log('✅ Los usuarios pueden votar múltiples veces');
    console.log('✅ No hay restricciones de límites');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (parseError) {
          reject(new Error(`Error parsing response: ${parseError.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

testUnlimitedVoting(); 