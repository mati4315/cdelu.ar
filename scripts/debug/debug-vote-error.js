const pool = require('./src/config/database');

async function debugVoteError() {
  console.log('🔍 Diagnosticando error en votación...');
  
  try {
    const surveyId = 3;
    const optionIds = [13];
    const userIdentifier = '127.0.0.1'; // IP de prueba
    
    console.log('1️⃣ Verificando encuesta...');
    const [surveys] = await pool.execute(
      'SELECT * FROM surveys WHERE id = ? AND status = "active"',
      [surveyId]
    );
    
    if (surveys.length === 0) {
      console.log('❌ Encuesta no encontrada o no está activa');
      return;
    }
    
    const survey = surveys[0];
    console.log(`✅ Encuesta encontrada: "${survey.title}"`);
    console.log(`   - Max votos por usuario: ${survey.max_votes_per_user}`);
    
    console.log('\n2️⃣ Verificando opciones...');
    const [options] = await pool.execute(
      'SELECT id FROM survey_options WHERE id IN (?) AND survey_id = ?',
      [optionIds, surveyId]
    );
    
    console.log(`✅ Opciones válidas: ${options.length}/${optionIds.length}`);
    
    console.log('\n3️⃣ Verificando votos existentes...');
    const [existingVotes] = await pool.execute(
      'SELECT option_id FROM survey_votes WHERE survey_id = ? AND user_ip = ?',
      [surveyId, userIdentifier]
    );
    
    console.log(`✅ Votos existentes: ${existingVotes.length}`);
    
    if (existingVotes.length > 0) {
      console.log('⚠️ Usuario ya votó en esta encuesta');
      return;
    }
    
    console.log('\n4️⃣ Intentando insertar voto...');
    
    // Probar inserción directa
    try {
      const [result] = await pool.execute(
        'INSERT INTO survey_votes (survey_id, option_id, user_ip, user_agent) VALUES (?, ?, ?, ?)',
        [surveyId, optionIds[0], userIdentifier, 'Test Agent']
      );
      
      console.log('✅ Voto insertado exitosamente');
      console.log(`   - ID del voto: ${result.insertId}`);
      
      // Verificar que se insertó
      const [newVote] = await pool.execute(
        'SELECT * FROM survey_votes WHERE id = ?',
        [result.insertId]
      );
      
      if (newVote.length > 0) {
        console.log('✅ Voto verificado en la base de datos');
        console.log(`   - Survey ID: ${newVote[0].survey_id}`);
        console.log(`   - Option ID: ${newVote[0].option_id}`);
        console.log(`   - User IP: ${newVote[0].user_ip}`);
      }
      
      // Limpiar el voto de prueba
      await pool.execute('DELETE FROM survey_votes WHERE id = ?', [result.insertId]);
      console.log('🧹 Voto de prueba eliminado');
      
    } catch (insertError) {
      console.error('❌ Error al insertar voto:', insertError.message);
      console.error('   Código de error:', insertError.code);
      console.error('   SQL State:', insertError.sqlState);
      
      // Verificar estructura de la tabla
      console.log('\n5️⃣ Verificando estructura de la tabla...');
      const [columns] = await pool.execute('DESCRIBE survey_votes');
      console.log('Columnas de survey_votes:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
      });
      
      // Verificar restricciones
      console.log('\n6️⃣ Verificando restricciones...');
      const [constraints] = await pool.execute(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'survey_votes' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      console.log('Restricciones de survey_votes:');
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error durante el diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugVoteError()
    .then(() => {
      console.log('\n🏁 Diagnóstico completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = debugVoteError; 