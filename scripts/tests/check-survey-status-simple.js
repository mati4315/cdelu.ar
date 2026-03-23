const pool = require('./src/config/database');

async function checkSurveyStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE ENCUESTAS EN BASE DE DATOS');
  console.log('================================================');
  
  try {
    // 1. Verificar encuestas existentes
    console.log('\n📊 1. Encuestas en la base de datos:');
    const [surveys] = await pool.execute(`
      SELECT id, question, status, created_at, expires_at,
             (SELECT COUNT(*) FROM survey_options WHERE survey_id = surveys.id) as options_count,
             (SELECT COUNT(*) FROM survey_votes WHERE survey_id = surveys.id) as votes_count
      FROM surveys 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (surveys.length === 0) {
      console.log('⚠️  No hay encuestas en la base de datos');
      return;
    }
    
    console.log(`📋 Total encuestas encontradas: ${surveys.length}`);
    surveys.forEach((survey, index) => {
      console.log(`\n${index + 1}. ID: ${survey.id}`);
      console.log(`   Pregunta: "${survey.question}"`);
      console.log(`   Estado: ${survey.status}`);
      console.log(`   Opciones: ${survey.options_count}`);
      console.log(`   Votos: ${survey.votes_count}`);
      console.log(`   Creada: ${survey.created_at}`);
      console.log(`   Expira: ${survey.expires_at || 'Nunca'}`);
    });
    
    // 2. Filtrar encuestas activas
    console.log('\n🎯 2. Encuestas activas:');
    const activeSurveys = surveys.filter(s => s.status === 'active');
    
    if (activeSurveys.length === 0) {
      console.log('⚠️  No hay encuestas activas');
      
      // Intentar activar una encuesta para pruebas
      if (surveys.length > 0) {
        console.log('\n🔧 3. Activando encuesta para pruebas...');
        const surveyToActivate = surveys[0];
        
        await pool.execute(
          'UPDATE surveys SET status = ? WHERE id = ?',
          ['active', surveyToActivate.id]
        );
        
        console.log(`✅ Encuesta ID ${surveyToActivate.id} activada para pruebas`);
        console.log(`   Pregunta: "${surveyToActivate.question}"`);
      }
    } else {
      console.log(`✅ ${activeSurveys.length} encuestas activas encontradas`);
      activeSurveys.forEach((survey, index) => {
        console.log(`   ${index + 1}. ID ${survey.id}: "${survey.question}"`);
      });
    }
    
    // 3. Simular llamada como usuario invitado
    console.log('\n👤 4. Simulando comportamiento de usuario invitado...');
    
    // Crear request mock para simular usuario no autenticado
    const mockRequest = {
      user: null, // Usuario no autenticado
      ip: '127.0.0.1'
    };
    
    // Simular la lógica del controlador
    const [activeEncuestas] = await pool.execute(`
      SELECT 
        s.id, s.question, s.is_multiple_choice, s.max_votes_per_user,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 3
    `);
    
    console.log(`📊 Encuestas activas para API: ${activeEncuestas.length}`);
    
    if (activeEncuestas.length > 0) {
      for (let survey of activeEncuestas) {
        // Obtener opciones
        const [options] = await pool.execute(`
          SELECT 
            so.id, 
            so.option_text,
            so.display_order,
            COUNT(sv.id) as votes_count,
            ROUND((COUNT(sv.id) / NULLIF(?, 0)) * 100, 2) as percentage
          FROM survey_options so
          LEFT JOIN survey_votes sv ON so.id = sv.option_id
          WHERE so.survey_id = ?
          GROUP BY so.id, so.option_text, so.display_order
          ORDER BY so.display_order, so.id
        `, [survey.total_votes, survey.id]);
        
        // Simular lógica de usuario invitado (CORREGIDA)
        const userId = mockRequest.user ? mockRequest.user.id : null;
        let hasVoted = false;
        
        if (userId) {
          // Usuario autenticado - verificar votos
          const [userVote] = await pool.execute(`
            SELECT id FROM survey_votes 
            WHERE survey_id = ? AND user_id = ? AND has_voted = TRUE
            LIMIT 1
          `, [survey.id, userId]);
          hasVoted = userVote.length > 0;
        } else {
          // Usuario anónimo/invitado SIEMPRE ve opciones (estado 0)
          hasVoted = false;
        }
        
        console.log(`\n📋 Encuesta ID ${survey.id}:`);
        console.log(`   Pregunta: "${survey.question}"`);
        console.log(`   has_voted: ${hasVoted}`);
        console.log(`   show_options: ${!hasVoted}`);
        console.log(`   Total opciones: ${options.length}`);
        
        if (hasVoted === false && !hasVoted === true) {
          console.log('   ✅ CORRECTO: Usuario invitado ve estado 0 (opciones)');
        } else {
          console.log('   ❌ ERROR: Usuario invitado ve estado incorrecto');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSurveyStatus(); 