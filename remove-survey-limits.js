const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function removeSurveyLimits() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Removiendo límites de participación en encuestas...\n');
    
    // 1. Actualizar max_votes_per_user a sin límite
    console.log('📈 Paso 1: Actualizando límites de votos por usuario...');
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE surveys 
        SET max_votes_per_user = 999999 
        WHERE max_votes_per_user = 1
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    console.log('✅ Límites de votos actualizados a 999,999 (sin límite práctico)');
    
    // 2. Eliminar restricción UNIQUE unique_user_vote
    console.log('\n🔓 Paso 2: Eliminando restricción unique_user_vote...');
    try {
      await new Promise((resolve, reject) => {
        connection.query(`
          ALTER TABLE survey_votes 
          DROP INDEX unique_user_vote
        `, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
      console.log('✅ Restricción unique_user_vote eliminada');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ Restricción unique_user_vote no existe o ya fue eliminada');
      } else {
        throw error;
      }
    }
    
    // 3. Eliminar restricción UNIQUE unique_ip_vote
    console.log('\n🔓 Paso 3: Eliminando restricción unique_ip_vote...');
    try {
      await new Promise((resolve, reject) => {
        connection.query(`
          ALTER TABLE survey_votes 
          DROP INDEX unique_ip_vote
        `, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
      console.log('✅ Restricción unique_ip_vote eliminada');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ Restricción unique_ip_vote no existe o ya fue eliminada');
      } else {
        throw error;
      }
    }
    
    // 4. Verificar cambios aplicados
    console.log('\n📊 Verificando cambios aplicados...');
    
    // Verificar límites actualizados
    const [surveys] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, question, max_votes_per_user 
        FROM surveys 
        WHERE status = 'active'
      `, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve([results]);
        }
      });
    });
    
    console.log('📋 Límites actuales:');
    surveys.forEach(survey => {
      console.log(`   Survey ${survey.id}: ${survey.max_votes_per_user} votos permitidos`);
    });
    
    // Verificar restricciones restantes
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
    
    console.log('\n🔒 Restricciones UNIQUE restantes:');
    if (constraints.length === 0) {
      console.log('   ✅ No hay restricciones UNIQUE - Participación completamente libre');
    } else {
      constraints.forEach(constraint => {
        console.log(`   ⚠️ ${constraint.Key_name}: ${constraint.Column_name}`);
      });
    }
    
    console.log('\n🎉 ¡LÍMITES REMOVIDOS EXITOSAMENTE!');
    console.log('✅ Ahora TODOS los usuarios pueden:');
    console.log('   • Votar múltiples veces en la misma encuesta');
    console.log('   • Cambiar su voto si así lo desean');
    console.log('   • Participar sin restricciones');
    console.log('\n💡 El frontend ya no mostrará errores de límite alcanzado');
    
  } catch (error) {
    console.error('❌ Error durante la eliminación de límites:', error);
  } finally {
    connection.end();
  }
}

removeSurveyLimits(); 