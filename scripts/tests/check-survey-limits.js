const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function checkSurveyLimits() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verificando límites de encuestas...\n');
    
    // 1. Verificar límites en las encuestas
    console.log('📊 Límites actuales de encuestas:');
    const [surveys] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          id,
          title,
          question,
          status,
          max_votes_per_user,
          is_multiple_choice,
          total_votes
        FROM surveys 
        WHERE status = 'active'
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
      console.log(`      ⚠️ Límite actual: ${survey.max_votes_per_user} votos por usuario`);
      console.log(`      Estado: ${survey.status}`);
      console.log(`      Múltiple: ${survey.is_multiple_choice ? 'Sí' : 'No'}`);
      console.log(`      Total votos: ${survey.total_votes}\n`);
    });
    
    // 2. Verificar restricciones UNIQUE en survey_votes
    console.log('🔒 Verificando restricciones UNIQUE en survey_votes:');
    const [constraints] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'trigamer_diario' 
        AND TABLE_NAME = 'survey_votes' 
        AND CONSTRAINT_NAME LIKE '%unique%'
        ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    constraints.forEach(constraint => {
      console.log(`   🔒 ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME}`);
    });
    
    // 3. Verificar intentos de voto duplicado
    console.log('\n🚫 Verificando votos duplicados por usuario:');
    const [duplicateVotes] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          survey_id,
          user_id,
          COUNT(*) as vote_count
        FROM survey_votes 
        WHERE user_id IS NOT NULL
        GROUP BY survey_id, user_id
        HAVING COUNT(*) > 1
        ORDER BY vote_count DESC
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    if (duplicateVotes.length > 0) {
      console.log('   ⚠️ Usuarios con múltiples votos encontrados:');
      duplicateVotes.forEach(vote => {
        console.log(`      Usuario ${vote.user_id} votó ${vote.vote_count} veces en encuesta ${vote.survey_id}`);
      });
    } else {
      console.log('   ✅ No se encontraron votos duplicados');
    }
    
    console.log('\n💡 SOLUCIÓN RECOMENDADA:');
    console.log('   1. Cambiar max_votes_per_user a 999 (sin límite práctico)');
    console.log('   2. Mantener restricciones UNIQUE para evitar spam');
    console.log('   3. Permitir que cada usuario vote múltiples veces si así se desea');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    connection.end();
  }
}

checkSurveyLimits(); 