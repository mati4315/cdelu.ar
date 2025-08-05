const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function testUserVotePersistence() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🧪 Probando persistencia del estado de votación...\n');
    
    // 1. Verificar votos existentes
    console.log('📊 Votos existentes en la base de datos:');
    const [votes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.id,
          sv.survey_id,
          sv.user_id,
          sv.has_voted,
          sv.voted_at,
          s.question,
          so.option_text
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        JOIN survey_options so ON sv.option_id = so.id
        ORDER BY sv.voted_at DESC
        LIMIT 10
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    votes.forEach(vote => {
      console.log(`   ID: ${vote.id}, Survey: ${vote.survey_id}, User: ${vote.user_id}, Has Voted: ${vote.has_voted}, Question: "${vote.question}", Option: "${vote.option_text}"`);
    });
    
    // 2. Simular consulta como si fuera Lucas (user_id = 11)
    console.log('\n👤 Simulando consulta para Lucas (user_id = 11):');
    const [lucasVotes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.survey_id,
          s.question,
          sv.has_voted,
          COUNT(sv.id) as total_votes
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        WHERE sv.user_id = 11 AND sv.has_voted = TRUE
        GROUP BY sv.survey_id, s.question, sv.has_voted
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    if (lucasVotes.length > 0) {
      console.log('   ✅ Lucas ha votado en las siguientes encuestas:');
      lucasVotes.forEach(vote => {
        console.log(`      Survey ${vote.survey_id}: "${vote.question}" - Has Voted: ${vote.has_voted}`);
      });
    } else {
      console.log('   ⚠️ Lucas no ha votado en ninguna encuesta');
    }
    
    // 3. Simular consulta de encuestas activas para Lucas
    console.log('\n📡 Simulando GET /api/v1/surveys/active para Lucas:');
    const [activeSurveys] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          s.id,
          s.question,
          COUNT(DISTINCT sv.id) as total_votes,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM survey_votes sv2 
              WHERE sv2.survey_id = s.id 
              AND sv2.user_id = 11 
              AND sv2.has_voted = TRUE
            ) THEN TRUE
            ELSE FALSE
          END as has_voted,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM survey_votes sv2 
              WHERE sv2.survey_id = s.id 
              AND sv2.user_id = 11 
              AND sv2.has_voted = TRUE
            ) THEN FALSE
            ELSE TRUE
          END as show_options
        FROM surveys s
        LEFT JOIN survey_votes sv ON s.id = sv.survey_id
        WHERE s.status = 'active'
        GROUP BY s.id, s.question
        ORDER BY s.created_at DESC
        LIMIT 5
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('   📋 Encuestas activas para Lucas:');
    activeSurveys.forEach(survey => {
      console.log(`      ID: ${survey.id} - "${survey.question}"`);
      console.log(`         Total Votes: ${survey.total_votes}`);
      console.log(`         Has Voted: ${survey.has_voted}`);
      console.log(`         Show Options: ${survey.show_options}`);
      console.log(`         Estado: ${survey.has_voted ? 'Estado 1 (Resultados)' : 'Estado 0 (Opciones)'}`);
      console.log('');
    });
    
    console.log('✅ Prueba de persistencia completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    connection.end();
  }
}

testUserVotePersistence(); 