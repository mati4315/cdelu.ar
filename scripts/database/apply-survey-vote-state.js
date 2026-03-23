const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function applySurveyVoteState() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Aplicando sistema de estado binario para encuestas...\n');
    
    // Leer el archivo SQL
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./add-survey-vote-state.sql', 'utf8');
    
    // Ejecutar el script SQL
    await new Promise((resolve, reject) => {
      connection.query(sqlContent, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('✅ Campo has_voted agregado correctamente');
    
    // Verificar la estructura actualizada
    const [structure] = await new Promise((resolve, reject) => {
      connection.query('DESCRIBE survey_votes', (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('\n📋 Estructura actualizada de survey_votes:');
    structure.forEach(field => {
      console.log(`   ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${field.Default ? `DEFAULT ${field.Default}` : ''}`);
    });
    
    // Verificar datos de ejemplo
    const [examples] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
            sv.id,
            sv.survey_id,
            sv.user_id,
            sv.has_voted,
            sv.voted_at,
            s.question
        FROM survey_votes sv
        JOIN surveys s ON sv.survey_id = s.id
        LIMIT 5
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('\n📊 Ejemplos de votos con estado:');
    examples.forEach(vote => {
      console.log(`   ID: ${vote.id}, Survey: ${vote.survey_id}, User: ${vote.user_id}, Has Voted: ${vote.has_voted}, Question: "${vote.question}"`);
    });
    
    console.log('\n✅ Sistema de estado binario aplicado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la aplicación:', error);
  } finally {
    connection.end();
  }
}

applySurveyVoteState(); 