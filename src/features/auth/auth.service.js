"use strict";

const bcrypt = require('bcryptjs');
const repo = require('./auth.repository');

async function registerUser({ nombre, email, password, rol }) {
  const exists = await repo.emailExists(email);
  if (exists) {
    return { ok: false, code: 'EMAIL_IN_USE' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await repo.insertUser({ nombre, email, passwordHash, rol });
  const user = await repo.findUserById(userId);
  return { ok: true, user };
}

async function authenticateUser({ email, password }) {
  const user = await repo.findUserByEmail(email);
  if (!user) return { ok: false, code: 'INVALID_CREDENTIALS' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { ok: false, code: 'INVALID_CREDENTIALS' };

  // No devolvemos password
  const { password: _p, ...safeUser } = user;
  return { ok: true, user: safeUser };
}

async function getProfile(userId) {
  const user = await repo.findUserById(userId);
  if (!user) return null;
  return user;
}

async function updateProfile(userId, { nombre, email }) {
  if (email) {
    const inUse = await repo.otherUserHasEmail(email, userId);
    if (inUse) return { ok: false, code: 'EMAIL_IN_USE' };
  }
  const done = await repo.updateUserProfile(userId, { nombre, email });
  return { ok: done };
}

module.exports = {
  registerUser,
  authenticateUser,
  getProfile,
  updateProfile,
};


