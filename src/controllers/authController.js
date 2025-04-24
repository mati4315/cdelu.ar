const bcrypt = require('bcrypt');
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

    // Obtener el rol especificado
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE nombre = ?',
      [role]
    );

    if (roles.length === 0) {
      return reply.status(400).send({ error: 'Rol no válido' });
    }

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      `INSERT INTO users (nombre, email, password, role_id) 
       VALUES (?, ?, ?, ?)`,
      [nombre, email, hashedPassword, roles[0].id]
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

    // Buscar usuario por email
    const [users] = await pool.query(
      `SELECT u.*, r.nombre as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

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

    // Enviar respuesta con token y datos del usuario
    return reply.send({
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
    return reply.status(500).send({ error: 'Error al iniciar sesión' });
  }
}

module.exports = {
  register,
  login
}; 