const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function debugSurveyData() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Debuggeando datos de encuestas...\n');
    
    // 1. Verificar encuestas activas
    console.log('📊 Encuestas activas:');
    const [activeSurveys] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          id, question, status, created_at, expires_at
        FROM surveys 
        WHERE status = 'active'
        ORDER BY created_at DESC
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    activeSurveys.forEach(survey => {
      console.log(`   ID: ${survey.id} - "${survey.question}" (${survey.status})`);
    });
    
    // 2. Verificar opciones de encuestas
    console.log('\n📋 Opciones de encuestas:');
    const [options] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          so.id,
          so.survey_id,
          so.option_text,
          so.votes_count,
          s.question
        FROM survey_options so
        JOIN surveys s ON so.survey_id = s.id
        WHERE s.status = 'active'
        ORDER BY so.survey_id, so.display_order
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    options.forEach(option => {
      console.log(`   Survey ${option.survey_id}: "${option.option_text}" (votes_count: ${option.votes_count})`);
    });
    
    // 3. Verificar votos reales
    console.log('\n🗳️ Votos reales:');
    const [votes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.id,
          sv.survey_id,
          sv.option_id,
          sv.user_id,
          sv.has_voted,
          so.option_text,
          s.question
        FROM survey_votes sv
        JOIN survey_options so ON sv.option_id = so.id
        JOIN surveys s ON sv.survey_id = s.id
        WHERE s.status = 'active'
        ORDER BY sv.voted_at DESC
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    votes.forEach(vote => {
      console.log(`   Vote ID: ${vote.id}, Survey: ${vote.survey_id}, Option: "${vote.option_text}", User: ${vote.user_id}, Has Voted: ${vote.has_voted}`);
    });
    
    // 4. Simular la consulta exacta del backend
    console.log('\n🔧 Simulando consulta del backend:');
    const [simulatedResult] = await new Promise((resolve, reject) => {
      connection.query(`
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
        LIMIT 5
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('   Resultado de la consulta principal:');
    simulatedResult.forEach(survey => {
      console.log(`      ID: ${survey.id}, Question: "${survey.question}", Total Votes: ${survey.total_votes}`);
    });
    
    // 5. Simular consulta de opciones para la primera encuesta
    if (simulatedResult.length > 0) {
      const firstSurvey = simulatedResult[0];
      console.log(`\n🔧 Simulando consulta de opciones para survey ${firstSurvey.id}:`);
      
      const [simulatedOptions] = await new Promise((resolve, reject) => {
        connection.query(`
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
        `, [firstSurvey.total_votes, firstSurvey.id], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve([results]);
          }
        });
      });
      
      console.log('   Resultado de la consulta de opciones:');
      simulatedOptions.forEach(option => {
        console.log(`      ID: ${option.id}, Text: "${option.option_text}", Votes: ${option.votes_count}, Percentage: ${option.percentage}%`);
      });
    }
    
    console.log('\n✅ Debug completado');
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    connection.end();
  }
}

debugSurveyData(); 