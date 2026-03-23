const pool = require('./src/config/database');

async function createMissingTables() {
  try {
    console.log('🎯 Creando tablas faltantes del sistema unificado...\n');
    
    // 1. Crear content_likes
    console.log('1️⃣ Creando tabla content_likes...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS content_likes (
        id INT(11) NOT NULL AUTO_INCREMENT,
        content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
        user_id INT(11) NOT NULL COMMENT 'ID del usuario que dio like',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY (id),
        INDEX idx_content_id (content_id),
        INDEX idx_user_id (user_id),
        INDEX idx_content_user (content_id, user_id),
        UNIQUE KEY unique_user_content (user_id, content_id)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ content_likes creada');
    
    // 2. Crear content_comments
    console.log('\n2️⃣ Creando tabla content_comments...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS content_comments (
        id INT(11) NOT NULL AUTO_INCREMENT,
        content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
        user_id INT(11) NOT NULL COMMENT 'ID del usuario que comentó',
        contenido TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY (id),
        INDEX idx_content_id (content_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ content_comments creada');
    
    // 3. Migrar likes existentes
    console.log('\n3️⃣ Migrando likes existentes...');
    
    // Likes de noticias
    const [likesNews] = await pool.execute(`
      INSERT IGNORE INTO content_likes (content_id, user_id, created_at)
      SELECT cf.id, l.user_id, l.created_at
      FROM likes l
      JOIN content_feed cf ON cf.type = 1 AND cf.original_id = l.news_id
    `);
    console.log(`✅ ${likesNews.affectedRows} likes de noticias migrados`);
    
    // Likes de comunidad
    const [likesCom] = await pool.execute(`
      INSERT IGNORE INTO content_likes (content_id, user_id, created_at)
      SELECT cf.id, cl.user_id, cl.created_at
      FROM com_likes cl
      JOIN content_feed cf ON cf.type = 2 AND cf.original_id = cl.com_id
    `);
    console.log(`✅ ${likesCom.affectedRows} likes de comunidad migrados`);
    
    // 4. Migrar comentarios existentes
    console.log('\n4️⃣ Migrando comentarios existentes...');
    
    // Comentarios de noticias
    const [commentsNews] = await pool.execute(`
      INSERT IGNORE INTO content_comments (content_id, user_id, contenido, created_at)
      SELECT cf.id, c.user_id, c.content, c.created_at
      FROM comments c
      JOIN content_feed cf ON cf.type = 1 AND cf.original_id = c.news_id
    `);
    console.log(`✅ ${commentsNews.affectedRows} comentarios de noticias migrados`);
    
    // Comentarios de comunidad
    const [commentsCom] = await pool.execute(`
      INSERT IGNORE INTO content_comments (content_id, user_id, contenido, created_at)
      SELECT cf.id, cc.user_id, cc.content, cc.created_at
      FROM com_comments cc
      JOIN content_feed cf ON cf.type = 2 AND cf.original_id = cc.com_id
    `);
    console.log(`✅ ${commentsCom.affectedRows} comentarios de comunidad migrados`);
    
    // 5. Actualizar contadores
    console.log('\n5️⃣ Actualizando contadores...');
    
    await pool.execute(`
      UPDATE content_feed cf SET likes_count = (
        SELECT COUNT(*) FROM content_likes cl WHERE cl.content_id = cf.id
      )
    `);
    
    await pool.execute(`
      UPDATE content_feed cf SET comments_count = (
        SELECT COUNT(*) FROM content_comments cc WHERE cc.content_id = cf.id
      )
    `);
    console.log('✅ Contadores actualizados');
    
    // 6. Verificar resultado
    console.log('\n📊 VERIFICACIÓN FINAL:');
    
    const [contentFeed] = await pool.execute('SELECT COUNT(*) as count FROM content_feed');
    const [contentLikes] = await pool.execute('SELECT COUNT(*) as count FROM content_likes');
    const [contentComments] = await pool.execute('SELECT COUNT(*) as count FROM content_comments');
    
    console.log(`✅ content_feed: ${contentFeed[0].count} registros`);
    console.log(`✅ content_likes: ${contentLikes[0].count} registros`);
    console.log(`✅ content_comments: ${contentComments[0].count} registros`);
    
    const [stats] = await pool.execute(`
      SELECT 
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        COUNT(CASE WHEN type = 1 THEN 1 END) as noticias,
        COUNT(CASE WHEN type = 2 THEN 1 END) as comunidad
      FROM content_feed
    `);
    
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`📰 Noticias: ${stats[0].noticias}`);
    console.log(`💬 Comunidad: ${stats[0].comunidad}`);
    console.log(`❤️ Total likes: ${stats[0].total_likes}`);
    console.log(`💬 Total comentarios: ${stats[0].total_comments}`);
    
    console.log('\n🎉 ¡Sistema de Feed Unificado completado exitosamente!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createMissingTables(); 