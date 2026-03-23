const pool = require('./src/config/database');

async function checkSurveyTriggers() {
  try {
    console.log('🔍 Verificando triggers de encuestas...\n');

    // Verificar si los triggers existen
    const [triggers] = await pool.execute(`
      SELECT TRIGGER_NAME 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = DATABASE() 
      AND TRIGGER_NAME IN ('update_option_votes_count', 'update_option_votes_count_delete', 'create_survey_stats')
    `);

    console.log('📋 Triggers encontrados:');
    triggers.forEach(trigger => {
      console.log(`   ✅ ${trigger.TRIGGER_NAME}`);
    });

    if (triggers.length < 3) {
      console.log('\n⚠️  Faltan algunos triggers. Aplicando triggers...');
      
      // Aplicar triggers
      const triggerSQL = `
        DELIMITER //
        
        -- Trigger para actualizar contador de votos en survey_options
        CREATE TRIGGER IF NOT EXISTS update_option_votes_count
        AFTER INSERT ON survey_votes
        FOR EACH ROW
        BEGIN
            UPDATE survey_options 
            SET votes_count = votes_count + 1 
            WHERE id = NEW.option_id;
            
            UPDATE surveys 
            SET total_votes = total_votes + 1 
            WHERE id = NEW.survey_id;
        END//
        
        -- Trigger para actualizar contador cuando se elimina un voto
        CREATE TRIGGER IF NOT EXISTS update_option_votes_count_delete
        AFTER DELETE ON survey_votes
        FOR EACH ROW
        BEGIN
            UPDATE survey_options 
            SET votes_count = votes_count - 1 
            WHERE id = OLD.option_id;
            
            UPDATE surveys 
            SET total_votes = total_votes - 1 
            WHERE id = OLD.survey_id;
        END//
        
        -- Trigger para actualizar estadísticas cuando se crea una encuesta
        CREATE TRIGGER IF NOT EXISTS create_survey_stats
        AFTER INSERT ON surveys
        FOR EACH ROW
        BEGIN
            INSERT INTO survey_stats (survey_id, total_votes, unique_voters)
            VALUES (NEW.id, 0, 0);
        END//
        
        DELIMITER ;
      `;

      // Ejecutar cada trigger por separado
      await pool.query('DROP TRIGGER IF EXISTS update_option_votes_count');
      await pool.query(`
        CREATE TRIGGER update_option_votes_count
        AFTER INSERT ON survey_votes
        FOR EACH ROW
        UPDATE survey_options 
        SET votes_count = votes_count + 1 
        WHERE id = NEW.option_id
      `);

      await pool.query('DROP TRIGGER IF EXISTS update_option_votes_count_delete');
      await pool.query(`
        CREATE TRIGGER update_option_votes_count_delete
        AFTER DELETE ON survey_votes
        FOR EACH ROW
        UPDATE survey_options 
        SET votes_count = votes_count - 1 
        WHERE id = OLD.option_id
      `);

      await pool.query('DROP TRIGGER IF EXISTS create_survey_stats');
      await pool.query(`
        CREATE TRIGGER create_survey_stats
        AFTER INSERT ON surveys
        FOR EACH ROW
        INSERT INTO survey_stats (survey_id, total_votes, unique_voters)
        VALUES (NEW.id, 0, 0)
      `);

      console.log('✅ Triggers aplicados correctamente');
    }

    // Verificar datos de encuestas
    console.log('\n📊 Verificando datos de encuestas...');
    
    const [surveys] = await pool.execute('SELECT id, question, total_votes FROM surveys WHERE status = "active" LIMIT 5');
    
    console.log('📋 Encuestas activas:');
    for (const survey of surveys) {
      console.log(`   📝 ID: ${survey.id} - "${survey.question}" (${survey.total_votes || 0} votos totales)`);
      
      const [options] = await pool.execute(`
        SELECT id, option_text, votes_count 
        FROM survey_options 
        WHERE survey_id = ? 
        ORDER BY display_order, id
      `, [survey.id]);
      
      options.forEach(option => {
        console.log(`      • ${option.option_text}: ${option.votes_count || 0} votos`);
      });
    }

    // Verificar votos reales
    console.log('\n🔍 Verificando votos reales vs contadores...');
    for (const survey of surveys) {
      const [realVotes] = await pool.execute(`
        SELECT 
          so.id,
          so.option_text,
          so.votes_count as counter_votes,
          COUNT(sv.id) as real_votes
        FROM survey_options so
        LEFT JOIN survey_votes sv ON so.id = sv.option_id
        WHERE so.survey_id = ?
        GROUP BY so.id, so.option_text, so.votes_count
      `, [survey.id]);
      
      console.log(`\n📊 Encuesta ${survey.id}:`);
      realVotes.forEach(option => {
        const status = option.counter_votes === option.real_votes ? '✅' : '❌';
        console.log(`   ${status} "${option.option_text}": ${option.real_votes} reales vs ${option.counter_votes} en contador`);
      });
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await pool.end();
  }
}

checkSurveyTriggers(); 