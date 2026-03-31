const repository = require('./users.repository');

/**
 * Servicio para lógica de negocio de usuarios
 */
class UsersService {
  /**
   * Obtener perfil público de un usuario por username
   * @param {string} username - Username del usuario
   * @param {number|null} viewerId - ID del usuario que ve el perfil (para saber si lo sigue)
   * @returns {Object} - Perfil público del usuario
   */
  async getPublicProfile(username, viewerId = null) {
    const user = await repository.findByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener estadísticas del usuario
    const stats = await repository.getUserStats(user.id);
    
    // Verificar si el usuario actual sigue a este usuario
    let isFollowing = false;
    let isOwnProfile = false;
    
    if (viewerId) {
      isOwnProfile = viewerId === user.id;
      if (!isOwnProfile) {
        isFollowing = await repository.isFollowing(viewerId, user.id);
      }
    }

    // Preparar respuesta del perfil público
    const profile = {
      id: user.id,
      nombre: user.nombre,
      username: user.username,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      created_at: user.created_at,
      is_verified: user.is_verified,
      stats: {
        followers_count: stats.followers_count,
        following_count: stats.following_count,
        posts_count: stats.posts_count
      }
    };

    // Solo incluir email para admins o para el propio usuario
    if (viewerId && (user.role === 'administrador' || isOwnProfile)) {
      profile.email = user.email;
    }

    // Solo incluir información de seguimiento si hay un usuario viendo
    if (viewerId) {
      profile.is_following = isFollowing;
      profile.is_own_profile = isOwnProfile;
    }

    return profile;
  }

  /**
   * Obtener posts públicos de un usuario
   * @param {string} username - Username del usuario
   * @param {number|null} viewerId - ID del usuario que ve los posts
   * @param {number} page - Página actual
   * @param {number} limit - Límite de resultados por página
   * @param {string} order - Orden de los posts (asc|desc)
   * @returns {Object} - Posts del usuario con paginación
   */
  async getUserPosts(username, viewerId, page = 1, limit = 10, order = 'desc') {
    const user = await repository.findByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const offset = (page - 1) * limit;
    
    // Obtener posts con información de likes
    const posts = await repository.getUserPostsWithLikes(user.id, viewerId, limit, offset, order);
    
    // Obtener total de posts para paginación
    const total = await repository.countUserPosts(user.id);
    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
  }

  /**
   * Seguir a un usuario
   * @param {number} followerId - ID del usuario que sigue
   * @param {number} followingId - ID del usuario a seguir
   * @returns {Object} - Resultado de la operación
   */
  async followUser(followerId, followingId) {
    // Verificar que el usuario a seguir existe
    const userToFollow = await repository.findById(followingId);
    if (!userToFollow) {
      throw new Error('Usuario no encontrado');
    }

    try {
      const result = await repository.followUser(followerId, followingId);
      return {
        is_following: true,
        followers_count: result.followers_count,
        message: `Ahora sigues a ${userToFollow.nombre}`
      };
    } catch (error) {
      if (error.message === 'Ya sigues a este usuario') {
        // Si ya lo sigue, devolver error 409 (Conflict)
        const err = new Error('Ya sigues a este usuario');
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Dejar de seguir a un usuario
   * @param {number} followerId - ID del usuario que deja de seguir
   * @param {number} followingId - ID del usuario a dejar de seguir
   * @returns {Object} - Resultado de la operación
   */
  async unfollowUser(followerId, followingId) {
    // Verificar que el usuario existe
    const userToUnfollow = await repository.findById(followingId);
    if (!userToUnfollow) {
      throw new Error('Usuario no encontrado');
    }

    try {
      const result = await repository.unfollowUser(followerId, followingId);
      return {
        is_following: false,
        followers_count: result.followers_count,
        message: `Ya no sigues a ${userToUnfollow.nombre}`
      };
    } catch (error) {
      if (error.message === 'No sigues a este usuario') {
        // Si no lo sigue, devolver error 409 (Conflict)
        const err = new Error('No sigues a este usuario');
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Obtener lista de seguidores de un usuario
   * @param {string} username - Username del usuario
   * @param {number|null} viewerId - ID del usuario que ve la lista
   * @param {number} page - Página actual
   * @param {number} limit - Límite de resultados por página
   * @returns {Object} - Lista de seguidores con paginación
   */
  async getFollowers(username, viewerId, page = 1, limit = 20) {
    const user = await repository.findByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const offset = (page - 1) * limit;
    
    // Obtener seguidores
    const followers = await repository.getFollowers(user.id, limit, offset);
    
    // Si hay un usuario viendo, verificar qué usuarios de la lista sigue
    if (viewerId && followers.length > 0) {
      for (const follower of followers) {
        follower.is_following = await repository.isFollowing(viewerId, follower.id);
      }
    } else {
      // Si no hay usuario viendo, is_following siempre es false
      followers.forEach(follower => {
        follower.is_following = false;
      });
    }
    
    // Obtener total para paginación
    const total = await repository.countFollowers(user.id);
    const totalPages = Math.ceil(total / limit);

    return {
      data: followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
  }

  /**
   * Obtener lista de usuarios que sigue un usuario
   * @param {string} username - Username del usuario
   * @param {number|null} viewerId - ID del usuario que ve la lista
   * @param {number} page - Página actual
   * @param {number} limit - Límite de resultados por página
   * @returns {Object} - Lista de usuarios seguidos con paginación
   */
  async getFollowing(username, viewerId, page = 1, limit = 20) {
    const user = await repository.findByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const offset = (page - 1) * limit;
    
    // Obtener usuarios seguidos
    const following = await repository.getFollowing(user.id, limit, offset);
    
    // Si hay un usuario viendo, verificar qué usuarios de la lista sigue
    if (viewerId && following.length > 0) {
      for (const followedUser of following) {
        followedUser.is_following = await repository.isFollowing(viewerId, followedUser.id);
      }
    } else {
      // Si no hay usuario viendo, is_following siempre es false
      following.forEach(followedUser => {
        followedUser.is_following = false;
      });
    }
    
    // Obtener total para paginación
    const total = await repository.countFollowing(user.id);
    const totalPages = Math.ceil(total / limit);

    return {
      data: following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
  }

  /**
   * Buscar usuarios por nombre o username
   * @param {string} query - Término de búsqueda
   * @param {number|null} viewerId - ID del usuario que realiza la búsqueda
   * @param {number} page - Página actual
   * @param {number} limit - Límite de resultados por página
   * @returns {Object} - Usuarios encontrados con paginación
   */
  async searchUsers(query, viewerId, page = 1, limit = 20) {
    if (!query || query.trim().length < 2) {
      throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
    }

    const offset = (page - 1) * limit;
    
    // Buscar usuarios
    const users = await repository.searchUsers(query.trim(), limit, offset);
    
    // Si hay un usuario viendo, verificar qué usuarios de la lista sigue
    if (viewerId && users.length > 0) {
      for (const user of users) {
        user.is_following = await repository.isFollowing(viewerId, user.id);
      }
    } else {
      // Si no hay usuario viendo, is_following siempre es false
      users.forEach(user => {
        user.is_following = false;
      });
    }
    
    // Obtener total para paginación
    const total = await repository.countSearchUsers(query.trim());
    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
  }

  /**
   * Generar username único a partir del nombre
   * @param {string} nombre - Nombre completo del usuario
   * @param {number} userId - ID del usuario (para hacer único)
   * @returns {string} - Username único generado
   */
  generateUsername(nombre, userId) {
    // Limpiar y normalizar el nombre
    const cleanName = nombre
      .toLowerCase()
      .trim()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '.'); // Reemplazar espacios con puntos

    // Agregar ID para garantizar unicidad
    return `${cleanName}.${userId}`;
  }
}

module.exports = new UsersService();
