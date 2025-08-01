const bcrypt = require('bcryptjs');
const pool = require('../config/database');

/**
 * Registra un nuevo usuario
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function register(request, reply) {
  try {
    const { nombre, email, password, role = 'usuario' } = request.body;

    // Verificar si el usuario ya existe
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return reply.status(400).send({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el role_id
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE nombre = ?',
      [role]
    );

    if (roles.length === 0) {
      return reply.status(400).send({ error: 'Rol inválido' });
    }

    const roleId = roles[0].id;

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      `INSERT INTO users (nombre, email, password, role_id) 
       VALUES (?, ?, ?, ?)`,
      [nombre, email, hashedPassword, roleId]
    );

    // Generar token JWT
    const token = await reply.jwtSign({
      id: result.insertId,
      email,
      role
    });

    reply.status(201).send({
      token,
      user: {
        id: result.insertId,
        nombre,
        email,
        role
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al registrar el usuario' });
  }
}

/**
 * Inicia sesión de un usuario
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function login(request, reply) {
  try {
    const { email, password } = request.body;

    // Buscar usuario por email con join a roles
    const [users] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.password, u.is_active, r.nombre as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return reply.status(401).send({ error: 'Usuario desactivado' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role
    });

    reply.send({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al iniciar sesión' });
  }
}

/**
 * Obtiene el perfil del usuario actual
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function getProfile(request, reply) {
  try {
    const userId = request.user.id;

    const [users] = await pool.query(
      `SELECT u.id, u.nombre, u.email, r.nombre as role, u.created_at 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    reply.send({ user: users[0] });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al obtener el perfil' });
  }
}

/**
 * Actualiza el perfil del usuario
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function updateProfile(request, reply) {
  try {
    const userId = request.user.id;
    const { nombre, email } = request.body;

    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUser.length > 0) {
        return reply.status(400).send({ error: 'El email ya está en uso' });
      }
    }

    // Actualizar usuario
    const [result] = await pool.query(
      'UPDATE users SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, userId]
    );

    if (result.affectedRows === 0) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    reply.send({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error al actualizar el perfil' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
}; 