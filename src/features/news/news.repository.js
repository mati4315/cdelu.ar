"use strict";

// Repositorio de acceso a datos para Noticias
// Centraliza todas las consultas SQL relacionadas al dominio News

const pool = require('../../config/database');

/**
 * Obtiene lista paginada de noticias con métricas de likes y comentarios.
 * Nota: La ordenación se realiza en el servicio de forma segura.
 * @param {number} limit
 * @param {number} offset
 * @param {string} orderByClause
 * @returns {Promise<any[]>}
 */
async function fetchNewsList(limit, offset, orderByClause) {
  const [rows] = await pool.query(
    `SELECT 
       n.*,
       u.nombre as autor,
       COUNT(DISTINCT l.id) as likes_count,
       COUNT(DISTINCT c.id) as comments_count
     FROM news n
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN likes l ON n.id = l.news_id
     LEFT JOIN comments c ON n.id = c.news_id
     GROUP BY n.id
     ${orderByClause}
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

/**
 * Obtiene el total de noticias para paginación.
 * @returns {Promise<number>}
 */
async function fetchNewsTotalCount() {
  const [rows] = await pool.query('SELECT COUNT(*) as total FROM news');
  return rows[0]?.total ?? 0;
}

/**
 * Obtiene una noticia por ID con autor.
 * @param {number} id
 * @returns {Promise<any|null>}
 */
async function fetchNewsById(id) {
  const [rows] = await pool.query(
    `SELECT n.*, u.nombre as autor 
     FROM news n 
     LEFT JOIN users u ON n.created_by = u.id 
     WHERE n.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Inserta una noticia y devuelve el ID generado.
 * @param {object} data
 * @returns {Promise<number>}
 */
async function insertNews(data) {
  const { titulo, descripcion, resumen, image_url, original_url, is_oficial, created_by } = data;
  const [result] = await pool.query(
    `INSERT INTO news (
       titulo, descripcion, resumen, image_url, original_url, is_oficial, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, resumen, image_url, original_url, is_oficial, created_by]
  );
  return result.insertId;
}

/**
 * Actualiza una noticia existente.
 * @param {number} id
 * @param {object} data
 */
async function updateNewsById(id, data) {
  const { titulo, descripcion, resumen, image_url, original_url, is_oficial } = data;
  await pool.query(
    `UPDATE news SET 
       titulo = ?, 
       descripcion = ?, 
       resumen = ?,
       image_url = ?, 
       original_url = ?, 
       is_oficial = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [titulo, descripcion, resumen, image_url, original_url, is_oficial, id]
  );
}

/**
 * Elimina una noticia por ID. Devuelve affectedRows.
 * @param {number} id
 * @returns {Promise<number>}
 */
async function deleteNewsById(id) {
  const [result] = await pool.query('DELETE FROM news WHERE id = ?', [id]);
  return result.affectedRows;
}

/**
 * Verifica si existe un like de un usuario sobre una noticia.
 * @param {number} userId
 * @param {number} newsId
 * @returns {Promise<boolean>}
 */
async function existsLike(userId, newsId) {
  const [rows] = await pool.query(
    'SELECT id FROM likes WHERE user_id = ? AND news_id = ?',
    [userId, newsId]
  );
  return rows.length > 0;
}

/**
 * Inserta un like.
 * @param {number} userId
 * @param {number} newsId
 */
async function createLike(userId, newsId) {
  await pool.query('INSERT INTO likes (user_id, news_id) VALUES (?, ?)', [userId, newsId]);
}

/**
 * Elimina un like.
 * @param {number} userId
 * @param {number} newsId
 * @returns {Promise<number>}
 */
async function deleteLike(userId, newsId) {
  const [result] = await pool.query('DELETE FROM likes WHERE user_id = ? AND news_id = ?', [userId, newsId]);
  return result.affectedRows;
}

/**
 * Obtiene comentarios de una noticia.
 * @param {number} newsId
 * @returns {Promise<any[]>}
 */
async function fetchComments(newsId) {
  const [rows] = await pool.query(
    `SELECT c.*, u.nombre as autor 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.news_id = ? 
     ORDER BY c.created_at DESC`,
    [newsId]
  );
  return rows;
}

/**
 * Crea un comentario en una noticia.
 * @param {number} userId
 * @param {number} newsId
 * @param {string} content
 * @returns {Promise<number>} insertId
 */
async function createComment(userId, newsId, content) {
  const [result] = await pool.query(
    'INSERT INTO comments (user_id, news_id, content) VALUES (?, ?, ?)',
    [userId, newsId, content]
  );
  return result.insertId;
}

/**
 * Obtiene el contador de comentarios desde content_feed.
 * @param {number} newsId
 * @returns {Promise<number>}
 */
async function getCommentsCountFromFeed(newsId) {
  const [rows] = await pool.query(
    'SELECT comments_count FROM content_feed WHERE type = 1 AND original_id = ?',
    [newsId]
  );
  return rows[0] ? rows[0].comments_count : 0;
}

module.exports = {
  fetchNewsList,
  fetchNewsTotalCount,
  fetchNewsById,
  insertNews,
  updateNewsById,
  deleteNewsById,
  existsLike,
  createLike,
  deleteLike,
  fetchComments,
  createComment,
  getCommentsCountFromFeed,
};


