const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function testExactQuery() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🧪 Probando consulta exacta del backend...\n');
    
    // 1. Obtener encuestas activas (primera consulta)
    console.log('📡 Consulta 1: Obtener encuestas activas');
    const [surveys] = await new Promise((resolve, reject) => {
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
    
    console.log('   Resultado:');
    surveys.forEach(survey => {
      console.log(`      ID: ${survey.id}, Question: "${survey.question}", Total Votes: ${survey.total_votes}`);
    });
    
    // 2. Para cada encuesta, obtener opciones (segunda consulta)
    for (let survey of surveys) {
      console.log(`\n📡 Consulta 2: Opciones para survey ${survey.id} (total_votes: ${survey.total_votes})`);
      
      const [options] = await new Promise((resolve, reject) => {
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
        `, [survey.total_votes, survey.id], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve([results]);
          }
        });
      });
      
      console.log(`   Resultado para survey ${survey.id}:`);
      options.forEach(option => {
        console.log(`      ID: ${option.id}, Text: "${option.option_text}", Votes: ${option.votes_count}, Percentage: ${option.percentage}%, Display Order: ${option.display_order}`);
      });
      
      // 3. Simular la respuesta que debería enviar el backend
      console.log(`\n📤 Respuesta que debería enviar el backend para survey ${survey.id}:`);
      const mockResponse = {
        id: survey.id,
        question: survey.question,
        total_votes: survey.total_votes,
        has_voted: false, // Simulado
        show_options: true, // Simulado
        options: options
      };
      
      console.log(JSON.stringify(mockResponse, null, 2));
    }
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    connection.end();
  }
}

testExactQuery(); 