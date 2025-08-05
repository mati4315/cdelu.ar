const http = require('http');

function debugBackendResponse() {
  console.log('🔍 Debuggeando respuesta del backend...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/surveys/active',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📊 Respuesta completa del backend:');
      try {
        const jsonData = JSON.parse(data);
        
        // Verificar estructura de la respuesta
        console.log('✅ Estructura de la respuesta:');
        console.log(`   success: ${jsonData.success}`);
        console.log(`   data.length: ${jsonData.data ? jsonData.data.length : 'undefined'}`);
        
        if (jsonData.data && jsonData.data.length > 0) {
          const survey = jsonData.data[0];
          console.log('\n📝 Primera encuesta:');
          console.log(`   ID: ${survey.id}`);
          console.log(`   Question: "${survey.question}"`);
          console.log(`   Total Votes: ${survey.total_votes}`);
          console.log(`   Has Voted: ${survey.has_voted}`);
          console.log(`   Show Options: ${survey.show_options}`);
          
          if (survey.options && survey.options.length > 0) {
            console.log('\n📋 Opciones de la primera encuesta:');
            survey.options.forEach((option, index) => {
              console.log(`   Opción ${index + 1}:`);
              console.log(`     ID: ${option.id}`);
              console.log(`     Text: "${option.option_text}"`);
              console.log(`     Votes Count: ${option.votes_count} (tipo: ${typeof option.votes_count})`);
              console.log(`     Percentage: ${option.percentage} (tipo: ${typeof option.percentage})`);
              console.log(`     Display Order: ${option.display_order}`);
              
              // Verificar todos los campos del objeto
              console.log(`     Todos los campos: ${Object.keys(option).join(', ')}`);
              
              // Verificar si los campos críticos están presentes
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
          console.log('   ⚠️ No hay encuestas en la respuesta');
        }
        
        // Mostrar respuesta JSON completa
        console.log('\n🔍 Respuesta JSON completa:');
        console.log(JSON.stringify(jsonData, null, 2));
        
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

debugBackendResponse(); 