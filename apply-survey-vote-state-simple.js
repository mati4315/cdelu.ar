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
    
    // 1. Agregar campo has_voted
    console.log('📝 Agregando campo has_voted...');
    await new Promise((resolve, reject) => {
      connection.query('ALTER TABLE survey_votes ADD COLUMN has_voted BOOLEAN DEFAULT FALSE', (error) => {
        if (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   ✅ Campo has_voted ya existe');
            resolve();
          } else {
            reject(error);
          }
        } else {
          console.log('   ✅ Campo has_voted agregado');
          resolve();
        }
      });
    });
    
    // 2. Actualizar registros existentes
    console.log('🔄 Actualizando registros existentes...');
    await new Promise((resolve, reject) => {
      connection.query('UPDATE survey_votes SET has_voted = TRUE WHERE id > 0', (error, result) => {
        if (error) {
          reject(error);
        } else {
          console.log(`   ✅ ${result.affectedRows} registros actualizados`);
          resolve();
        }
      });
    });
    
    // 3. Crear índice
    console.log('🔍 Creando índice...');
    await new Promise((resolve, reject) => {
      connection.query('CREATE INDEX idx_survey_votes_user_survey ON survey_votes(user_id, survey_id, has_voted)', (error) => {
        if (error) {
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log('   ✅ Índice ya existe');
            resolve();
          } else {
            reject(error);
          }
        } else {
          console.log('   ✅ Índice creado');
          resolve();
        }
      });
    });
    
    // 4. Verificar estructura
    console.log('\n📋 Verificando estructura actualizada...');
    const [structure] = await new Promise((resolve, reject) => {
      connection.query('DESCRIBE survey_votes', (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('   Estructura de survey_votes:');
    structure.forEach(field => {
      console.log(`     ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${field.Default ? `DEFAULT ${field.Default}` : ''}`);
    });
    
    // 5. Verificar datos de ejemplo
    console.log('\n📊 Verificando datos de ejemplo...');
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
    
    console.log('   Ejemplos de votos con estado:');
    examples.forEach(vote => {
      console.log(`     ID: ${vote.id}, Survey: ${vote.survey_id}, User: ${vote.user_id}, Has Voted: ${vote.has_voted}, Question: "${vote.question}"`);
    });
    
    console.log('\n✅ Sistema de estado binario aplicado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la aplicación:', error);
  } finally {
    connection.end();
  }
}

applySurveyVoteState(); 