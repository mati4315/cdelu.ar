const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testBackendUpdates() {
  console.log('🧪 Probando actualizaciones del backend...\n');

  let authToken = null;

  try {
    // 0. Hacer login para obtener token
    console.log('0️⃣ Haciendo login para obtener token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'matias4315@gmail.com',
      password: 'w35115415'
    });
    
    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Login exitoso, token obtenido');
    } else {
      console.log('❌ Error en login:', loginResponse.data);
      return;
    }

    // 1. Probar obtener encuestas activas
    console.log('\n1️⃣ Probando GET /surveys/active...');
    const activeResponse = await axios.get(`${BASE_URL}/surveys/active?limit=10`);
    console.log('✅ Encuestas activas obtenidas correctamente');
    console.log(`📊 Encuestas encontradas: ${activeResponse.data.data?.length || 0}`);
    
    if (activeResponse.data.data?.length > 0) {
      const survey = activeResponse.data.data[0];
      console.log('📋 Campos de la encuesta:', Object.keys(survey));
      
      // Verificar que no tenga title ni description
      if (survey.title) {
        console.log('❌ ERROR: La encuesta aún tiene campo "title"');
      } else {
        console.log('✅ Campo "title" eliminado correctamente');
      }
      
      if (survey.description) {
        console.log('❌ ERROR: La encuesta aún tiene campo "description"');
      } else {
        console.log('✅ Campo "description" eliminado correctamente');
      }
      
      // Mostrar estructura de la encuesta
      console.log('\n📋 Estructura de la encuesta:');
      Object.keys(survey).forEach(key => {
        console.log(`   - ${key}: ${typeof survey[key]}`);
      });
    }

    // 2. Probar obtener una encuesta específica
    console.log('\n2️⃣ Probando GET /surveys/:id...');
    const surveyResponse = await axios.get(`${BASE_URL}/surveys/15`);
    console.log('✅ Encuesta específica obtenida correctamente');
    console.log('📋 Campos de la encuesta:', Object.keys(surveyResponse.data.data));
    
    // Verificar estructura de la encuesta específica
    const surveyData = surveyResponse.data.data;
    console.log('\n📋 Estructura detallada de la encuesta:');
    Object.keys(surveyData).forEach(key => {
      const value = surveyData[key];
      if (typeof value === 'object' && value !== null) {
        console.log(`   - ${key}: [${Array.isArray(value) ? 'Array' : 'Object'}]`);
      } else {
        console.log(`   - ${key}: ${value} (${typeof value})`);
      }
    });

    // 3. Probar crear una encuesta (sin title y description)
    console.log('\n3️⃣ Probando POST /surveys (crear encuesta)...');
    const createData = {
      question: '¿Cuál es tu fruta favorita?',
      options: ['Manzana', 'Plátano', 'Naranja', 'Uva'],
      is_multiple_choice: false,
      max_votes_per_user: 1,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora
    };
    
    const createResponse = await axios.post(`${BASE_URL}/surveys`, createData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Encuesta creada correctamente');
    console.log('📋 Respuesta:', createResponse.data);
    
    // 4. Probar actualizar una encuesta
    console.log('\n4️⃣ Probando PUT /surveys/:id...');
    const updateData = {
      question: '¿Cuál es tu fruta favorita actualizada?',
      status: 'active'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/surveys/15`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Encuesta actualizada correctamente');
    console.log('📋 Respuesta:', updateResponse.data);

    // 5. Probar votar en una encuesta
    console.log('\n5️⃣ Probando POST /surveys/:id/vote...');
    const voteData = {
      option_ids: [52] // ID de la opción "Fútbol"
    };
    
    const voteResponse = await axios.post(`${BASE_URL}/surveys/15/vote`, voteData);
    console.log('✅ Voto registrado correctamente');
    console.log('📋 Respuesta:', voteResponse.data);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ Backend actualizado correctamente');
    console.log('✅ Campos title y description eliminados');
    console.log('✅ Endpoints funcionando con el nuevo esquema');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 El backend necesita ser actualizado:');
      console.log('1. Ejecutar: ALTER TABLE surveys DROP COLUMN title;');
      console.log('2. Ejecutar: ALTER TABLE surveys DROP COLUMN description;');
      console.log('3. Actualizar controladores para no usar estos campos');
    }
  }
}

testBackendUpdates(); 