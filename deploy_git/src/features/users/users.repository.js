const pool = require('../../config/database');

/**
 * Repositorio para manejo de usuarios y perfiles
 */
class UsersRepository {
  /**
   * Buscar usuario por username
   * @param {string} username - Username del usuario
   * @returns {Object|null} - Usuario encontrado o null
   */
  async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.email, u.username, u.bio, u.location, 
        u.website, u.is_verified, u.profile_picture_url, u.created_at, 
        r.nombre as role
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ?`,
      [username]
    );
    return rows[0] || null;
  }

  /**
   * Buscar usuario por ID
   * @param {number} userId - ID del usuario
   * @returns {Object|null} - Usuario encontrado o null
   */
  async findById(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.email, u.username, u.bio, u.location, 
        u.website, u.is_verified, u.profile_picture_url, u.created_at, 
        r.nombre as role
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * Buscar usuarios por nombre o username
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Array} - Lista de usuarios encontrados
   */
  async searchUsers(query, limit, offset) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.username, u.bio, u.profile_picture_url, 
        u.is_verified, u.created_at,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
       FROM users u 
       WHERE u.nombre LIKE ? OR u.username LIKE ?
       ORDER BY followers_count DESC, u.nombre ASC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, limit, offset]
    );
    return rows;
  }

  /**
   * Contar usuarios que coinciden con la búsqueda
   * @param {string} query - Término de búsqueda
   * @returns {number} - Total de usuarios encontrados
   */
  async countSearchUsers(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM users u 
       WHERE u.nombre LIKE ? OR u.username LIKE ?`,
      [searchTerm, searchTerm]
    );
    return rows[0].total;
  }

  /**
   * Obtener estadísticas de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} - Estadísticas del usuario
   */
  async getUserStats(userId) {
    const [stats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM user_follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM com WHERE user_id = ?) as posts_count
       `,
      [userId, userId, userId]
    );
    return stats[0] || { followers_count: 0, following_count: 0, posts_count: 0 };
  }

  /**
   * Verificar si un usuario sigue a otro
   * @param {number} followerId - ID del usuario que sigue
   * @param {number} followingId - ID del usuario seguido
   * @returns {boolean} - True si lo sigue, false si no
   */
  async isFollowing(followerId, followingId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return rows.length > 0;
  }

  /**
   * Seguir a un usuario
   * @param {number} followerId - ID del usuario que sigue
   * @param {number} followingId - ID del usuario a seguir
   * @returns {Object} - Resultado de la operación
   */
  async followUser(followerId, followingId) {
    // Verificar que no se siga a sí mismo
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    // Verificar que no lo siga ya
    const alreadyFollowing = await this.isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      throw new Error('Ya sigues a este usuario');
    }

    // Insertar la relación
    await pool.execute(
      'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    // Retornar nuevo conteo de seguidores
    const stats = await this.getUserStats(followingId);
    return { followers_count: stats.followers_count };
  }

  /**
   * Dejar de seguir a un usuario
   * @param {number} followerId - ID del usuario que deja de seguir
   * @param {number} followingId - ID del usuario a dejar de seguir
   * @returns {Object} - Resultado de la operación
   */
  async unfollowUser(followerId, followingId) {
    // Verificar que lo esté siguiendo
    const isFollowing = await this.isFollowing(followerId, followingId);
    if (!isFollowing) {
      throw new Error('No sigues a este usuario');
    }

    // Eliminar la relación
    await pool.execute(
      'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    // Retornar nuevo conteo de seguidores
    const stats = await this.getUserStats(followingId);
    return { followers_count: stats.followers_count };
  }

  /**
   * Obtener lista de seguidores de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Array} - Lista de seguidores
   */
  async getFollowers(userId, limit, offset) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.username, u.bio, u.profile_picture_url, 
        u.is_verified, uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       WHERE uf.following_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  /**
   * Contar seguidores de un usuario
   * @param {number} userId - ID del usuario
   * @returns {number} - Total de seguidores
   */
  async countFollowers(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_follows WHERE following_id = ?',
      [userId]
    );
    return rows[0].total;
  }

  /**
   * Obtener lista de usuarios que sigue un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Array} - Lista de usuarios seguidos
   */
  async getFollowing(userId, limit, offset) {
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.username, u.bio, u.profile_picture_url, 
        u.is_verified, uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.id
       WHERE uf.follower_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  /**
   * Contar usuarios que sigue un usuario
   * @param {number} userId - ID del usuario
   * @returns {number} - Total de usuarios seguidos
   */
  async countFollowing(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_follows WHERE follower_id = ?',
      [userId]
    );
    return rows[0].total;
  }

  /**
   * Obtener posts de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @param {string} order - Orden (asc|desc)
   * @returns {Array} - Lista de posts del usuario
   */
  async getUserPosts(userId, limit, offset, order = 'desc') {
    const orderBy = order === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await pool.execute(
      `SELECT 
        c.id, c.titulo, c.descripcion, c.image_url, c.video_url,
        c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM com_likes WHERE com_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE news_id = c.id) as comments_count,
        CASE 
          WHEN c.image_url IS NOT NULL THEN JSON_ARRAY(c.image_url)
          ELSE JSON_ARRAY()
        END as image_urls,
        u.nombre as autor, u.id as user_id
       FROM com c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = ?
       ORDER BY c.created_at ${orderBy}
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Procesar las URLs de imágenes
    return rows.map(post => ({
      ...post,
      image_urls: typeof post.image_urls === 'string' ? JSON.parse(post.image_urls) : post.image_urls
    }));
  }

  /**
   * Contar posts de un usuario
   * @param {number} userId - ID del usuario
   * @returns {number} - Total de posts del usuario
   */
  async countUserPosts(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM com WHERE user_id = ?',
      [userId]
    );
    return rows[0].total;
  }

  /**
   * Verificar si un usuario ha dado like a un post de comunidad
   * @param {number} userId - ID del usuario
   * @param {number} postId - ID del post
   * @returns {boolean} - True si ha dado like, false si no
   */
  async hasLikedPost(userId, postId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM com_likes WHERE user_id = ? AND com_id = ?',
      [userId, postId]
    );
    return rows.length > 0;
  }

  /**
   * Obtener posts de un usuario con información de likes para un usuario específico
   * @param {number} userId - ID del usuario propietario de los posts
   * @param {number|null} viewerId - ID del usuario que ve los posts (para likes)
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @param {string} order - Orden (asc|desc)
   * @returns {Array} - Lista de posts con información de likes
   */
  async getUserPostsWithLikes(userId, viewerId, limit, offset, order = 'desc') {
    const orderBy = order === 'asc' ? 'ASC' : 'DESC';
    
    let query, params;
    
    if (viewerId) {
      // Si hay un usuario viendo, incluir información de likes
      query = `
        SELECT 
          c.id, c.titulo, c.descripcion, c.image_url, c.video_url,
          c.created_at, c.updated_at,
          (SELECT COUNT(*) FROM com_likes WHERE com_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE news_id = c.id) as comments_count,
          CASE 
            WHEN c.image_url IS NOT NULL THEN JSON_ARRAY(c.image_url)
            ELSE JSON_ARRAY()
          END as image_urls,
          u.nombre as autor, u.id as user_id,
          CASE 
            WHEN EXISTS(SELECT 1 FROM com_likes WHERE user_id = ? AND com_id = c.id) THEN 1
            ELSE 0 
          END as is_liked
        FROM com c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.created_at ${orderBy}
        LIMIT ? OFFSET ?`;
      params = [viewerId, userId, limit, offset];
    } else {
      // Sin usuario viendo, is_liked siempre es false
      query = `
        SELECT 
          c.id, c.titulo, c.descripcion, c.image_url, c.video_url,
          c.created_at, c.updated_at,
          (SELECT COUNT(*) FROM com_likes WHERE com_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE news_id = c.id) as comments_count,
          CASE 
            WHEN c.image_url IS NOT NULL THEN JSON_ARRAY(c.image_url)
            ELSE JSON_ARRAY()
          END as image_urls,
          u.nombre as autor, u.id as user_id,
          0 as is_liked
        FROM com c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.created_at ${orderBy}
        LIMIT ? OFFSET ?`;
      params = [userId, limit, offset];
    }

    const [rows] = await pool.execute(query, params);

    // Procesar las URLs de imágenes y convertir is_liked a boolean
    return rows.map(post => ({
      ...post,
      image_urls: typeof post.image_urls === 'string' ? JSON.parse(post.image_urls) : post.image_urls,
      is_liked: Boolean(post.is_liked)
    }));
  }
}

module.exports = new UsersRepository();
