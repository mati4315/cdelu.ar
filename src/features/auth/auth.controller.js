"use strict";

const service = require('./auth.service');

async function register(request, reply) {
  try {
    const { nombre, email, password, rol = 'usuario' } = request.body;
    const res = await service.registerUser({ nombre, email, password, rol });
    if (!res.ok && res.code === 'EMAIL_IN_USE') {
      return reply.status(400).send({ error: 'El email ya está registrado' });
    }

    const token = await reply.jwtSign({ id: res.user.id, email: res.user.email, rol: res.user.rol });
    return reply.status(201).send({ token, user: res.user });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al registrar el usuario' });
  }
}

async function login(request, reply) {
  try {
    const { email, password } = request.body;
    const res = await service.authenticateUser({ email, password });
    if (!res.ok) return reply.status(401).send({ error: 'Credenciales inválidas' });

    const token = await reply.jwtSign({ id: res.user.id, email: res.user.email, rol: res.user.rol });
    return reply.send({ token, user: res.user });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al iniciar sesión' });
  }
}

async function getMe(request, reply) {
  try {
    const user = await service.getProfile(request.user.id);
    if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
    return reply.send({ user });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al obtener el perfil' });
  }
}

async function updateMe(request, reply) {
  try {
    const { nombre, email } = request.body;
    const res = await service.updateProfile(request.user.id, { nombre, email });
    if (!res.ok && res.code === 'EMAIL_IN_USE') {
      return reply.status(400).send({ error: 'El email ya está en uso' });
    }
    if (!res.ok) return reply.status(404).send({ error: 'Usuario no encontrado' });
    return reply.send({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al actualizar el perfil' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateMe,
};


