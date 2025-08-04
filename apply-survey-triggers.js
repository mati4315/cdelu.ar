const mysql = require('mysql2');
const fs = require('fs');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario',
  multipleStatements: true // Importante para ejecutar múltiples statements
};

async function applySurveyTriggers() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Aplicando triggers de encuestas...\n');
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('./fix-survey-triggers.sql', 'utf8');
    
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
    
    console.log('✅ Triggers aplicados correctamente');
    
    // Verificar que los triggers se crearon
    const [triggers] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = DATABASE() 
        AND TRIGGER_NAME IN ('update_option_votes_count', 'update_option_votes_count_delete', 'create_survey_stats')
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('\n📋 Triggers verificados:');
    triggers.forEach(trigger => {
      console.log(`   ✅ ${trigger.TRIGGER_NAME} - ${trigger.EVENT_MANIPULATION} en ${trigger.EVENT_OBJECT_TABLE}`);
    });
    
    // Verificar datos de encuestas
    console.log('\n📊 Verificando datos de encuestas...');
    
    const [surveys] = await new Promise((resolve, reject) => {
      connection.query('SELECT id, question, total_votes FROM surveys WHERE status = "active" LIMIT 5', (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('📋 Encuestas activas:');
    for (const survey of surveys) {
      console.log(`   📝 ID: ${survey.id} - "${survey.question}" (${survey.total_votes || 0} votos totales)`);
      
      const [options] = await new Promise((resolve, reject) => {
        connection.query(`
          SELECT id, option_text, votes_count 
          FROM survey_options 
          WHERE survey_id = ? 
          ORDER BY display_order, id
        `, [survey.id], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve([results]);
          }
        });
      });
      
      options.forEach(option => {
        console.log(`      • ${option.option_text}: ${option.votes_count || 0} votos`);
      });
    }
    
    console.log('\n✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la aplicación de triggers:', error);
  } finally {
    connection.end();
  }
}

applySurveyTriggers(); 