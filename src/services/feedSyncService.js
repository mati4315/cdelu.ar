const pool = require('../config/database');

/**
 * Servicio para sincronizar el content_feed con las tablas originales
 */
class FeedSyncService {
  /**
   * Sincronizar todas las noticias al content_feed
   */
  async syncNews() {
    try {
      const [news] = await pool.execute(`
        SELECT 
          n.id, n.titulo, n.descripcion, n.resumen, n.image_url, 
          n.original_url, n.published_at, n.is_oficial, n.created_at, n.updated_at,
          u.id as user_id, u.username as user_name, u.profile_picture_url as user_profile_picture,
          (SELECT COUNT(*) FROM likes WHERE news_id = n.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE news_id = n.id) as comments_count
        FROM news n
        LEFT JOIN users u ON n.created_by = u.id
      `);

      // Limpiar noticias existentes del feed
      await pool.execute('DELETE FROM content_feed WHERE type = 1');

      // Insertar noticias actualizadas
      for (const item of news) {
        await pool.execute(`
          INSERT INTO content_feed 
          (type, original_id, titulo, descripcion, resumen, image_url, video_url, 
           user_id, user_name, user_profile_picture, published_at, created_at, updated_at, 
           original_url, is_oficial, likes_count, comments_count)
          VALUES (1, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id, item.titulo, item.descripcion, item.resumen, item.image_url,
          item.user_id, item.user_name, item.user_profile_picture, item.published_at,
          item.created_at, item.updated_at, item.original_url, item.is_oficial,
          item.likes_count, item.comments_count
        ]);
      }

      return { synced: news.length, type: 'news' };
    } catch (error) {
      console.error('Error sincronizando noticias:', error);
      throw error;
    }
  }

  /**
   * Sincronizar todas las entradas de comunidad al content_feed
   */
  async syncCommunity() {
    try {
      const [community] = await pool.execute(`
        SELECT 
          c.id, c.titulo, c.descripcion, c.image_url, c.video_url, c.created_at, c.updated_at,
          u.id as user_id, u.username as user_name, u.profile_picture_url as user_profile_picture,
          (SELECT COUNT(*) FROM com_likes WHERE com_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE news_id = c.id) as comments_count
        FROM com c
        JOIN users u ON c.user_id = u.id
      `);

      // Limpiar entradas de comunidad existentes del feed
      await pool.execute('DELETE FROM content_feed WHERE type = 2');

      // Insertar entradas de comunidad actualizadas
      for (const item of community) {
        await pool.execute(`
          INSERT INTO content_feed 
          (type, original_id, titulo, descripcion, resumen, image_url, video_url, 
           user_id, user_name, user_profile_picture, published_at, created_at, updated_at, 
           original_url, is_oficial, likes_count, comments_count)
          VALUES (2, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, FALSE, ?, ?)
        `, [
          item.id, item.titulo, item.descripcion, item.image_url, item.video_url,
          item.user_id, item.user_name, item.user_profile_picture, item.created_at,
          item.created_at, item.updated_at, item.likes_count, item.comments_count
        ]);
      }

      return { synced: community.length, type: 'community' };
    } catch (error) {
      console.error('Error sincronizando comunidad:', error);
      throw error;
    }
  }

  /**
   * Sincronizar todo el content_feed
   */
  async syncAll() {
    try {
      const newsResult = await this.syncNews();
      const communityResult = await this.syncCommunity();

      return {
        success: true,
        results: [newsResult, communityResult],
        total: newsResult.synced + communityResult.synced
      };
    } catch (error) {
      console.error('Error en sincronización completa:', error);
      throw error;
    }
  }

  /**
   * Sincronizar un elemento específico (cuando se crea/actualiza)
   * @param {string} type - Tipo: 'news' o 'community'
   * @param {number} originalId - ID del elemento original
   */
  async syncItem(type, originalId) {
    try {
      if (type === 'news') {
        await this.syncSingleNews(originalId);
      } else if (type === 'community') {
        await this.syncSingleCommunity(originalId);
      }
    } catch (error) {
      console.error(`Error sincronizando ${type} ${originalId}:`, error);
      throw error;
    }
  }

  /**
   * Sincronizar una noticia específica
   * @param {number} newsId - ID de la noticia
   */
  async syncSingleNews(newsId) {
    const [news] = await pool.execute(`
      SELECT 
        n.id, n.titulo, n.descripcion, n.resumen, n.image_url, 
        n.original_url, n.published_at, n.is_oficial, n.created_at, n.updated_at,
        u.id as user_id, u.username as user_name, u.profile_picture_url as user_profile_picture,
        (SELECT COUNT(*) FROM likes WHERE news_id = n.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE news_id = n.id) as comments_count
      FROM news n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = ?
    `, [newsId]);

    if (news.length === 0) {
      // Si la noticia no existe, eliminar del feed
      await pool.execute('DELETE FROM content_feed WHERE type = 1 AND original_id = ?', [newsId]);
      return;
    }

    const item = news[0];

    // Verificar si ya existe en el feed
    const [existing] = await pool.execute(
      'SELECT id FROM content_feed WHERE type = 1 AND original_id = ?',
      [newsId]
    );

    if (existing.length > 0) {
      // Actualizar existente
      await pool.execute(`
        UPDATE content_feed SET
          titulo = ?, descripcion = ?, resumen = ?, image_url = ?,
          user_id = ?, user_name = ?, user_profile_picture = ?, published_at = ?,
          updated_at = ?, original_url = ?, is_oficial = ?, 
          likes_count = ?, comments_count = ?
        WHERE type = 1 AND original_id = ?
      `, [
        item.titulo, item.descripcion, item.resumen, item.image_url,
        item.user_id, item.user_name, item.user_profile_picture, item.published_at,
        item.updated_at, item.original_url, item.is_oficial,
        item.likes_count, item.comments_count, newsId
      ]);
    } else {
      // Insertar nuevo
      await pool.execute(`
        INSERT INTO content_feed 
        (type, original_id, titulo, descripcion, resumen, image_url, video_url, 
         user_id, user_name, user_profile_picture, published_at, created_at, updated_at, 
         original_url, is_oficial, likes_count, comments_count)
        VALUES (1, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id, item.titulo, item.descripcion, item.resumen, item.image_url,
        item.user_id, item.user_name, item.user_profile_picture, item.published_at,
        item.created_at, item.updated_at, item.original_url, item.is_oficial,
        item.likes_count, item.comments_count
      ]);
    }
  }

  /**
   * Sincronizar una entrada de comunidad específica
   * @param {number} comId - ID de la entrada de comunidad
   */
  async syncSingleCommunity(comId) {
    const [community] = await pool.execute(`
      SELECT 
        c.id, c.titulo, c.descripcion, c.image_url, c.video_url, c.created_at, c.updated_at,
        u.id as user_id, u.username as user_name, u.profile_picture_url as user_profile_picture,
        (SELECT COUNT(*) FROM com_likes WHERE com_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE news_id = c.id) as comments_count
      FROM com c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [comId]);

    if (community.length === 0) {
      // Si la entrada no existe, eliminar del feed
      await pool.execute('DELETE FROM content_feed WHERE type = 2 AND original_id = ?', [comId]);
      return;
    }

    const item = community[0];

    // Verificar si ya existe en el feed
    const [existing] = await pool.execute(
      'SELECT id FROM content_feed WHERE type = 2 AND original_id = ?',
      [comId]
    );

    if (existing.length > 0) {
      // Actualizar existente
      await pool.execute(`
        UPDATE content_feed SET
          titulo = ?, descripcion = ?, image_url = ?, video_url = ?,
          user_id = ?, user_name = ?, user_profile_picture = ?,
          updated_at = ?, likes_count = ?, comments_count = ?
        WHERE type = 2 AND original_id = ?
      `, [
        item.titulo, item.descripcion, item.image_url, item.video_url,
        item.user_id, item.user_name, item.user_profile_picture,
        item.updated_at, item.likes_count, item.comments_count, comId
      ]);
    } else {
      // Insertar nuevo
      await pool.execute(`
        INSERT INTO content_feed 
        (type, original_id, titulo, descripcion, resumen, image_url, video_url, 
         user_id, user_name, user_profile_picture, published_at, created_at, updated_at, 
         original_url, is_oficial, likes_count, comments_count)
        VALUES (2, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, FALSE, ?, ?)
      `, [
        item.id, item.titulo, item.descripcion, item.image_url, item.video_url,
        item.user_id, item.user_name, item.user_profile_picture, item.created_at,
        item.created_at, item.updated_at, item.likes_count, item.comments_count
      ]);
    }
  }
}

module.exports = new FeedSyncService();
