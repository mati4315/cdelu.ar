const { authenticate, authorize } = require('../middlewares/auth');
const pool = require('../config/database');

/**
 * Configura las rutas de usuarios
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function userRoutes(fastify, options) {
  // Obtener todos los usuarios (solo admin)
  fastify.get('/api/v1/users', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [users] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id`
      );

      // No enviar información sensible
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }));

      return reply.send({ data: sanitizedUsers });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener usuarios' });
    }
  });

  // Obtener perfil del usuario actual
  fastify.get('/api/v1/users/profile', {
    onRequest: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [users] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [request.user.id]
      );

      if (users.length === 0) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const user = users[0];
      return reply.send({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener el perfil' });
    }
  });

  // Actualizar un usuario (solo admin)
  fastify.put('/api/v1/users/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['administrador', 'colaborador', 'usuario'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { nombre, email, role } = request.body;

      // Verificar que el usuario existe
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );

      if (existingUser.length === 0) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      // Obtener el ID del rol si se quiere cambiar
      let roleId = null;
      if (role) {
        const [roleData] = await pool.query(
          'SELECT id FROM roles WHERE nombre = ?',
          [role]
        );
        if (roleData.length === 0) {
          return reply.status(400).send({ error: 'Rol no válido' });
        }
        roleId = roleData[0].id;
      }

      // Construir el query dinámicamente según los campos recibidos
      const updates = [];
      const values = [];

      if (nombre) {
        updates.push('nombre = ?');
        values.push(nombre);
      }

      if (email) {
        updates.push('email = ?');
        values.push(email);
      }

      if (roleId) {
        updates.push('role_id = ?');
        values.push(roleId);
      }

      // Añadir el id de usuario al final para el WHERE
      values.push(id);

      // Si no hay nada para actualizar
      if (updates.length === 0) {
        return reply.status(400).send({ error: 'No se proporcionaron datos para actualizar' });
      }

      // Ejecutar la actualización
      await pool.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      // Obtener el usuario actualizado
      const [updatedUser] = await pool.query(
        `SELECT u.*, r.nombre as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [id]
      );

      // Devolver los datos sanitizados
      const user = updatedUser[0];
      return reply.send({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar el usuario' });
    }
  });

  // Eliminar un usuario (solo admin)
  fastify.delete('/api/v1/users/:id', {
    onRequest: [authenticate, authorize(['administrador'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const adminId = request.user.id;

      // No permitir auto-eliminación del administrador
      if (id == adminId) {
        return reply.status(400).send({ error: 'No puedes eliminar tu propio usuario' });
      }

      // Eliminar al usuario
      const [result] = await pool.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      // Si hay un error de clave foránea, es porque hay datos relacionados
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return reply.status(400).send({ 
          error: 'No se puede eliminar este usuario porque tiene datos asociados. Considera desactivarlo en su lugar.' 
        });
      }
      return reply.status(500).send({ error: 'Error al eliminar el usuario' });
    }
  });
}

module.exports = userRoutes; 