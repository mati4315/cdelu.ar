const fetch = require('node-fetch');

async function testVote() {
  try {
    console.log('🧪 Probando votación con fetch...');
    
    const response = await fetch('http://localhost:3001/api/v1/surveys/3/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_ids: [13]
      })
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Voto registrado exitosamente!');
    } else {
      console.log('❌ Error:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testVote(); 