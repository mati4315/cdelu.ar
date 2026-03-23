"use strict";

const pool = require('../../config/database');

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.password, r.nombre as rol, u.profile_picture_url, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.email, r.nombre as rol, u.profile_picture_url, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function emailExists(email) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  return rows.length > 0;
}

async function insertUser({ nombre, email, passwordHash, rol }) {
  // Mapear nombre de rol a id
  const roleMap = {
    'administrador': 1,
    'colaborador': 2,
    'usuario': 3
  };
  const roleId = roleMap[rol] || 3;

  const [result] = await pool.query(
    `INSERT INTO users (nombre, email, password, role_id)
     VALUES (?, ?, ?, ?)`,
    [nombre, email, passwordHash, roleId]
  );
  return result.insertId;
}

async function updateUserProfile(id, { nombre, email }) {
  const [result] = await pool.query(
    'UPDATE users SET nombre = ?, email = ? WHERE id = ?',
    [nombre, email, id]
  );
  return result.affectedRows > 0;
}

async function otherUserHasEmail(email, excludeUserId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND id != ?',
    [email, excludeUserId]
  );
  return rows.length > 0;
}

module.exports = {
  findUserByEmail,
  findUserById,
  emailExists,
  insertUser,
  updateUserProfile,
  otherUserHasEmail,
};


