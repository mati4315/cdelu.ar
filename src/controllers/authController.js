const bcrypt = require('bcryptjs');
const pool = require('../config/database');

/**
 * Registra un nuevo usuario
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function register(request, reply) {
  try {
    const { nombre, email, password, rol = 'usuario' } = request.body;

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

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      `INSERT INTO users (nombre, email, password, rol) 
       VALUES (?, ?, ?, ?)`,
      [nombre, email, hashedPassword, rol]
    );

    // Generar token JWT
    const token = await reply.jwtSign({
      id: result.insertId,
      email,
      rol
    });

    reply.status(201).send({
      token,
      user: {
        id: result.insertId,
        nombre,
        email,
        rol,
        profile_picture_url: null
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

    console.log('🔐 Intento de login:', { email, password: password ? '***' : 'undefined' });

    // Buscar usuario por email
    const [users] = await pool.query(
      `SELECT id, nombre, email, password, rol, profile_picture_url, created_at
       FROM users 
       WHERE email = ?`,
      [email]
    );

    console.log('👥 Usuarios encontrados:', users.length);

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('👤 Usuario encontrado:', { id: user.id, nombre: user.nombre, rol: user.rol });

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 Verificación de contraseña:', validPassword);

    if (!validPassword) {
      console.log('❌ Contraseña inválida');
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    console.log('✅ Login exitoso, token generado');
    console.log('👤 Datos del usuario a enviar:', {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });

    const responseData = {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        profile_picture_url: user.profile_picture_url
      }
    };

    console.log('📤 Respuesta completa:', JSON.stringify(responseData, null, 2));
    reply.send(responseData);
  } catch (error) {
    console.error('❌ Error en login:', error);
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
      `SELECT id, nombre, email, rol, created_at 
       FROM users 
       WHERE id = ?`,
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