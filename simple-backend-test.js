const http = require('http');

function testBackend() {
  console.log('🔍 Probando backend directamente...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/surveys/active',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📡 Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📊 Respuesta del backend:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        // Verificar si hay encuestas
        if (jsonData.success && jsonData.data && jsonData.data.length > 0) {
          const survey = jsonData.data[0];
          console.log('\n🔍 Análisis de la primera encuesta:');
          console.log(`   ID: ${survey.id}`);
          console.log(`   Question: "${survey.question}"`);
          console.log(`   Total Votes: ${survey.total_votes}`);
          console.log(`   Has Voted: ${survey.has_voted}`);
          console.log(`   Show Options: ${survey.show_options}`);
          
          if (survey.options && survey.options.length > 0) {
            console.log('\n📋 Análisis de opciones:');
            survey.options.forEach((option, index) => {
              console.log(`   Opción ${index + 1}:`);
              console.log(`     ID: ${option.id}`);
              console.log(`     Text: "${option.option_text}"`);
              console.log(`     Votes Count: ${option.votes_count} (tipo: ${typeof option.votes_count})`);
              console.log(`     Percentage: ${option.percentage} (tipo: ${typeof option.percentage})`);
              console.log(`     Display Order: ${option.display_order}`);
              
              // Verificar campos críticos
              const hasVotesCount = 'votes_count' in option;
              const hasPercentage = 'percentage' in option;
              
              console.log(`     ✅ Votes Count presente: ${hasVotesCount}`);
              console.log(`     ✅ Percentage presente: ${hasPercentage}`);
              
              if (!hasVotesCount) {
                console.log(`     ❌ PROBLEMA: votes_count no está presente`);
              }
              if (!hasPercentage) {
                console.log(`     ❌ PROBLEMA: percentage no está presente`);
              }
            });
          } else {
            console.log('   ⚠️ No hay opciones en la encuesta');
          }
        } else {
          console.log('   ⚠️ No hay encuestas activas');
        }
      } catch (error) {
        console.error('❌ Error al parsear JSON:', error);
        console.log('Respuesta raw:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
  });

  req.end();
}

testBackend(); 