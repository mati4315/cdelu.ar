const service = require('./users.service');

/**
 * Controlador para gestión de usuarios y perfiles públicos
 */
class UsersController {
  /**
   * Obtener perfil público de un usuario por username
   * GET /api/v1/users/profile/:username
   */
  async getPublicProfile(request, reply) {
    try {
      const { username } = request.params;
      const viewerId = request.user ? request.user.id : null;

      const profile = await service.getPublicProfile(username, viewerId);
      
      return reply.send({
        success: true,
        data: profile
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener el perfil del usuario'
      });
    }
  }

  /**
   * Obtener posts públicos de un usuario
   * GET /api/v1/users/profile/:username/posts
   */
  async getUserPosts(request, reply) {
    try {
      const { username } = request.params;
      const { page = 1, limit = 10, order = 'desc' } = request.query;
      const viewerId = request.user ? request.user.id : null;

      // Validar parámetros de consulta
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
      const validatedOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

      const result = await service.getUserPosts(
        username, 
        viewerId, 
        validatedPage, 
        validatedLimit, 
        validatedOrder
      );
      
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener los posts del usuario'
      });
    }
  }

  /**
   * Seguir a un usuario
   * POST /api/v1/users/:id/follow
   */
  async followUser(request, reply) {
    try {
      const { id } = request.params;
      const followerId = request.user.id;
      const followingId = parseInt(id);

      // Verificar que no trate de seguirse a sí mismo
      if (followerId === followingId) {
        return reply.status(400).send({
          success: false,
          error: 'No puedes seguirte a ti mismo'
        });
      }

      const result = await service.followUser(followerId, followingId);
      
      return reply.send({
        success: true,
        message: result.message,
        data: {
          is_following: result.is_following,
          followers_count: result.followers_count
        }
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      if (error.statusCode === 409) {
        return reply.status(409).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al seguir al usuario'
      });
    }
  }

  /**
   * Dejar de seguir a un usuario
   * DELETE /api/v1/users/:id/follow
   */
  async unfollowUser(request, reply) {
    try {
      const { id } = request.params;
      const followerId = request.user.id;
      const followingId = parseInt(id);

      const result = await service.unfollowUser(followerId, followingId);
      
      return reply.send({
        success: true,
        message: result.message,
        data: {
          is_following: result.is_following,
          followers_count: result.followers_count
        }
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      if (error.statusCode === 409) {
        return reply.status(409).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al dejar de seguir al usuario'
      });
    }
  }

  /**
   * Obtener lista de seguidores de un usuario
   * GET /api/v1/users/profile/:username/followers
   */
  async getFollowers(request, reply) {
    try {
      const { username } = request.params;
      const { page = 1, limit = 20 } = request.query;
      const viewerId = request.user ? request.user.id : null;

      // Validar parámetros de consulta
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await service.getFollowers(username, viewerId, validatedPage, validatedLimit);
      
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener los seguidores'
      });
    }
  }

  /**
   * Obtener lista de usuarios que sigue un usuario
   * GET /api/v1/users/profile/:username/following
   */
  async getFollowing(request, reply) {
    try {
      const { username } = request.params;
      const { page = 1, limit = 20 } = request.query;
      const viewerId = request.user ? request.user.id : null;

      // Validar parámetros de consulta
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await service.getFollowing(username, viewerId, validatedPage, validatedLimit);
      
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Usuario no encontrado') {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener la lista de seguidos'
      });
    }
  }

  /**
   * Buscar usuarios por nombre o username
   * GET /api/v1/users/search
   */
  async searchUsers(request, reply) {
    try {
      const { query, page = 1, limit = 20 } = request.query;
      const viewerId = request.user ? request.user.id : null;

      if (!query) {
        return reply.status(400).send({
          success: false,
          error: 'Parámetro de búsqueda requerido'
        });
      }

      // Validar parámetros de consulta
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await service.searchUsers(query, viewerId, validatedPage, validatedLimit);
      
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'El término de búsqueda debe tener al menos 2 caracteres') {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Error al buscar usuarios'
      });
    }
  }
}

module.exports = new UsersController();
