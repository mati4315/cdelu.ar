const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function checkAnonymousVotes() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verificando votos anónimos...\n');
    
    // 1. Verificar todos los votos con sus IPs
    console.log('📊 Todos los votos registrados:');
    const [allVotes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.id,
          sv.survey_id,
          sv.option_id,
          sv.user_id,
          sv.user_ip,
          sv.has_voted,
          sv.voted_at,
          s.question,
          so.option_text
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        JOIN survey_options so ON sv.option_id = so.id
        ORDER BY sv.voted_at DESC
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    allVotes.forEach(vote => {
      console.log(`   ID: ${vote.id}, Survey: ${vote.survey_id}, User: ${vote.user_id || 'NULL'}, IP: ${vote.user_ip || 'NULL'}, Has Voted: ${vote.has_voted}, Option: "${vote.option_text}"`);
    });
    
    // 2. Verificar votos por IP específica (127.0.0.1 que suele ser la IP local)
    console.log('\n🔍 Votos desde IP 127.0.0.1:');
    const [localVotes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.id,
          sv.survey_id,
          sv.user_id,
          sv.has_voted,
          s.question
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        WHERE sv.user_ip = '127.0.0.1'
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    if (localVotes.length > 0) {
      console.log('   ⚠️ Encontrados votos desde IP local:');
      localVotes.forEach(vote => {
        console.log(`      Survey ${vote.survey_id}: User ${vote.user_id}, Has Voted: ${vote.has_voted}, Question: "${vote.question}"`);
      });
    } else {
      console.log('   ✅ No hay votos desde IP 127.0.0.1');
    }
    
    // 3. Verificar votos para las encuestas activas
    console.log('\n📋 Votos para encuestas activas:');
    const [activeSurveyVotes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          sv.survey_id,
          sv.user_id,
          sv.user_ip,
          sv.has_voted,
          COUNT(*) as vote_count
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        WHERE s.status = 'active'
        GROUP BY sv.survey_id, sv.user_id, sv.user_ip, sv.has_voted
        ORDER BY sv.survey_id
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    activeSurveyVotes.forEach(vote => {
      console.log(`   Survey ${vote.survey_id}: User ${vote.user_id || 'NULL'}, IP ${vote.user_ip || 'NULL'}, Has Voted: ${vote.has_voted}, Count: ${vote.vote_count}`);
    });
    
    // 4. Simular la consulta exacta del backend para IP 127.0.0.1
    console.log('\n🧪 Simulando consulta del backend para IP 127.0.0.1:');
    const surveyIds = [26, 25]; // IDs de las encuestas activas
    
    for (const surveyId of surveyIds) {
      const [ipCheck] = await new Promise((resolve, reject) => {
        connection.query(`
          SELECT id FROM survey_votes 
          WHERE survey_id = ? AND user_ip = ? AND has_voted = TRUE
          LIMIT 1
        `, [surveyId, '127.0.0.1'], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve([results]);
          }
        });
      });
      
      const hasVoted = ipCheck.length > 0;
      console.log(`   Survey ${surveyId}: IP 127.0.0.1 - Votos encontrados: ${ipCheck.length}, hasVoted: ${hasVoted}`);
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    connection.end();
  }
}

checkAnonymousVotes(); 