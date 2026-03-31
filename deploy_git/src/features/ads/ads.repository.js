"use strict";

const pool = require('../../config/database');

async function fetchActiveAds(limit, categoria) {
  let sql = `
    SELECT 
      id, titulo, descripcion, image_url, enlace_destino, 
      texto_opcional, categoria, prioridad, activo,
      impresiones_maximas, impresiones_actuales, clics_count,
      created_at, updated_at
    FROM ads 
    WHERE activo = TRUE`;
  const params = [];
  if (categoria) {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }
  sql += ' ORDER BY prioridad DESC, created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function countAllAds(whereClause, params) {
  const [rows] = await pool.query(`SELECT COUNT(*) as total FROM ads WHERE ${whereClause}`, params);
  return rows[0]?.total ?? 0;
}

async function fetchAllAds(whereClause, params, limit, offset) {
  const [rows] = await pool.query(
    `SELECT 
       a.id, a.titulo, a.descripcion, a.image_url, a.enlace_destino,
       a.texto_opcional, a.categoria, a.prioridad, a.activo,
       a.impresiones_maximas, a.impresiones_actuales, a.clics_count,
       a.created_at, a.updated_at,
       u.nombre as created_by_name
     FROM ads a
     LEFT JOIN users u ON a.created_by = u.id
     WHERE ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

async function fetchAdById(id) {
  const [rows] = await pool.query(
    `SELECT 
       a.id, a.titulo, a.descripcion, a.image_url, a.enlace_destino,
       a.texto_opcional, a.categoria, a.prioridad, a.activo,
       a.impresiones_maximas, a.impresiones_actuales, a.clics_count,
       a.created_at, a.updated_at,
       u.nombre as created_by_name
     FROM ads a
     LEFT JOIN users u ON a.created_by = u.id
     WHERE a.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function insertAd(data) {
  const [result] = await pool.query(
    `INSERT INTO ads (
       titulo, descripcion, image_url, enlace_destino, texto_opcional,
       categoria, prioridad, activo, impresiones_maximas, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.descripcion,
      data.image_url,
      data.enlace_destino,
      data.texto_opcional,
      data.categoria,
      data.prioridad,
      data.activo,
      data.impresiones_maximas,
      data.created_by,
    ]
  );
  return result.insertId;
}

async function updateAdById(id, updates) {
  const allowedFields = [
    'titulo', 'descripcion', 'image_url', 'enlace_destino', 'texto_opcional',
    'categoria', 'prioridad', 'activo', 'impresiones_maximas',
  ];
  const setClauses = [];
  const values = [];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }
  if (setClauses.length === 0) return false;
  values.push(id);
  await pool.query(`UPDATE ads SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return true;
}

async function deleteAdById(id) {
  const [result] = await pool.query('DELETE FROM ads WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function incrementImpression(id) {
  await pool.query(
    `UPDATE ads SET impresiones_actuales = impresiones_actuales + 1 
     WHERE id = ? AND activo = TRUE`,
    [id]
  );
}

async function incrementClick(id) {
  await pool.query(
    `UPDATE ads SET clics_count = clics_count + 1 
     WHERE id = ? AND activo = TRUE`,
    [id]
  );
}

async function fetchStats() {
  const [rows] = await pool.query(
    `SELECT 
       COUNT(*) as total_ads,
       COUNT(CASE WHEN activo = TRUE THEN 1 END) as ads_activos,
       COUNT(CASE WHEN activo = FALSE THEN 1 END) as ads_inactivos,
       SUM(impresiones_actuales) as total_impresiones,
       SUM(clics_count) as total_clics,
       AVG(CASE WHEN impresiones_actuales > 0 THEN (clics_count / impresiones_actuales) * 100 ELSE 0 END) as ctr_promedio
     FROM ads`
  );
  return rows[0];
}

module.exports = {
  fetchActiveAds,
  countAllAds,
  fetchAllAds,
  fetchAdById,
  insertAd,
  updateAdById,
  deleteAdById,
  incrementImpression,
  incrementClick,
  fetchStats,
};


