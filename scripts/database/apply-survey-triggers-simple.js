const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function applySurveyTriggers() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Aplicando triggers de encuestas...\n');
    
    // Eliminar triggers existentes
    console.log('🗑️  Eliminando triggers existentes...');
    await new Promise((resolve, reject) => {
      connection.query('DROP TRIGGER IF EXISTS update_option_votes_count', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      connection.query('DROP TRIGGER IF EXISTS update_option_votes_count_delete', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      connection.query('DROP TRIGGER IF EXISTS create_survey_stats', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    console.log('✅ Triggers eliminados');
    
    // Crear trigger para actualizar contador de votos al insertar
    console.log('🔧 Creando trigger update_option_votes_count...');
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TRIGGER update_option_votes_count
        AFTER INSERT ON survey_votes
        FOR EACH ROW
        UPDATE survey_options 
        SET votes_count = votes_count + 1 
        WHERE id = NEW.option_id
      `, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    // Crear trigger para actualizar contador al eliminar votos
    console.log('🔧 Creando trigger update_option_votes_count_delete...');
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TRIGGER update_option_votes_count_delete
        AFTER DELETE ON survey_votes
        FOR EACH ROW
        UPDATE survey_options 
        SET votes_count = votes_count - 1 
        WHERE id = OLD.option_id
      `, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    // Crear trigger para crear estadísticas al crear encuesta
    console.log('🔧 Creando trigger create_survey_stats...');
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TRIGGER create_survey_stats
        AFTER INSERT ON surveys
        FOR EACH ROW
        INSERT INTO survey_stats (survey_id, total_votes, unique_voters)
        VALUES (NEW.id, 0, 0)
      `, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    console.log('✅ Triggers creados correctamente');
    
    // Actualizar contadores existentes
    console.log('🔄 Sincronizando contadores existentes...');
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE survey_options so 
        SET votes_count = (
            SELECT COUNT(*) 
            FROM survey_votes sv 
            WHERE sv.option_id = so.id
        )
      `, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE surveys s 
        SET total_votes = (
            SELECT COUNT(*) 
            FROM survey_votes sv 
            WHERE sv.survey_id = s.id
        )
      `, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    console.log('✅ Contadores sincronizados');
    
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