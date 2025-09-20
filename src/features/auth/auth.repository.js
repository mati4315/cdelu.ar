"use strict";

const pool = require('../../config/database');

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, nombre, email, password, rol, profile_picture_url, created_at
     FROM users WHERE email = ?`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, nombre, email, rol, profile_picture_url, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function emailExists(email) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  return rows.length > 0;
}

async function insertUser({ nombre, email, passwordHash, rol }) {
  const [result] = await pool.query(
    `INSERT INTO users (nombre, email, password, rol)
     VALUES (?, ?, ?, ?)`,
    [nombre, email, passwordHash, rol]
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


