const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function checkSurveyStructure() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verificando estructura de tablas de encuestas...\n');
    
    // 1. Verificar estructura de tabla surveys
    console.log('📋 Estructura de tabla SURVEYS:');
    const [surveysColumns] = await new Promise((resolve, reject) => {
      connection.query(`
        DESCRIBE surveys
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    surveysColumns.forEach(column => {
      console.log(`   ${column.Field} - ${column.Type} - Default: ${column.Default || 'NULL'}`);
    });
    
    // 2. Verificar datos actuales de encuestas
    console.log('\n📊 Encuestas actuales:');
    const [surveys] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          id,
          question,
          status,
          max_votes_per_user,
          is_multiple_choice,
          total_votes,
          created_at
        FROM surveys 
        ORDER BY id
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    surveys.forEach(survey => {
      console.log(`   📋 Survey ID: ${survey.id}`);
      console.log(`      Pregunta: "${survey.question}"`);
      console.log(`      ⚠️ Límite: ${survey.max_votes_per_user} votos por usuario`);
      console.log(`      Estado: ${survey.status}`);
      console.log(`      Múltiple: ${survey.is_multiple_choice ? 'Sí' : 'No'}`);
      console.log(`      Total votos: ${survey.total_votes}`);
      console.log(`      Creada: ${survey.created_at}\n`);
    });
    
    // 3. Verificar estructura de survey_votes
    console.log('🗳️ Estructura de tabla SURVEY_VOTES:');
    const [votesColumns] = await new Promise((resolve, reject) => {
      connection.query(`
        DESCRIBE survey_votes
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    votesColumns.forEach(column => {
      console.log(`   ${column.Field} - ${column.Type} - Default: ${column.Default || 'NULL'}`);
    });
    
    // 4. Verificar restricciones UNIQUE
    console.log('\n🔒 Restricciones UNIQUE en survey_votes:');
    const [constraints] = await new Promise((resolve, reject) => {
      connection.query(`
        SHOW INDEX FROM survey_votes WHERE Key_name LIKE '%unique%'
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    constraints.forEach(constraint => {
      console.log(`   🔒 ${constraint.Key_name}: ${constraint.Column_name}`);
    });
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:');
    console.log('   ❌ max_votes_per_user está limitando los votos');
    console.log('   ❌ Restricciones UNIQUE impiden votos múltiples');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    connection.end();
  }
}

checkSurveyStructure(); 