"use strict";

// Repositorio de acceso a datos para Encuestas
// Centraliza todas las consultas SQL relacionadas al dominio Surveys

const pool = require('../../config/database');

async function countSurveysByStatus(status) {
  let whereClause = '';
  const params = [];
  if (status && status !== 'all') {
    if (status === 'active') {
      // Activas: status=active y no expiradas
      whereClause = "WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())";
    } else if (status === 'completed') {
      // Completadas: status=completed o expiradas (aunque sigan marcadas active)
      whereClause = "WHERE (s.status = 'completed') OR (s.status = 'active' AND s.expires_at IS NOT NULL AND s.expires_at <= NOW())";
    } else {
      whereClause = 'WHERE s.status = ?';
      params.push(status);
    }
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as total FROM surveys s ${whereClause}`,
    params
  );
  return rows[0]?.total ?? 0;
}

async function fetchSurveysWithCounts(status, limit, offset) {
  const params = [];
  let whereClause = '';
  if (status && status !== 'all') {
    if (status === 'active') {
      whereClause = "WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())";
    } else if (status === 'completed') {
      whereClause = "WHERE (s.status = 'completed') OR (s.status = 'active' AND s.expires_at IS NOT NULL AND s.expires_at <= NOW())";
    } else {
      whereClause = 'WHERE s.status = ?';
      params.push(status);
    }
  }
  const [rows] = await pool.execute(
    `SELECT 
       s.*,
       COUNT(DISTINCT so.id) as options_count,
       COUNT(DISTINCT sv.id) as total_votes
     FROM surveys s
     LEFT JOIN survey_options so ON s.id = so.survey_id
     LEFT JOIN survey_votes sv ON s.id = sv.survey_id
     ${whereClause}
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

async function fetchSurveyByIdWithTotalVotes(id) {
  const [rows] = await pool.execute(
    `SELECT s.*, COUNT(DISTINCT sv.id) as total_votes
     FROM surveys s
     LEFT JOIN survey_votes sv ON s.id = sv.survey_id
     WHERE s.id = ?
     GROUP BY s.id`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function fetchOptionsWithStats(surveyId, totalVotes) {
  const [rows] = await pool.execute(
    `SELECT 
       so.id,
       so.option_text,
       so.display_order,
       COUNT(sv.id) as votes_count,
       ROUND((COUNT(sv.id) / NULLIF(?, 0)) * 100, 2) as percentage
     FROM survey_options so
     LEFT JOIN survey_votes sv ON so.id = sv.option_id
     WHERE so.survey_id = ?
     GROUP BY so.id, so.option_text, so.display_order
     ORDER BY so.display_order, so.id`,
    [totalVotes, surveyId]
  );
  return rows;
}

async function fetchOptionsBasic(surveyId) {
  const [rows] = await pool.execute(
    'SELECT id, option_text, votes_count, display_order FROM survey_options WHERE survey_id = ? ORDER BY display_order, id',
    [surveyId]
  );
  return rows;
}

async function fetchActiveSurveysWithCounts(limit) {
  const [rows] = await pool.execute(
    `SELECT 
       s.id, s.question, s.is_multiple_choice, s.max_votes_per_user, s.expires_at,
       COUNT(DISTINCT so.id) as options_count,
       COUNT(DISTINCT sv.id) as total_votes
     FROM surveys s
     LEFT JOIN survey_options so ON s.id = so.survey_id
     LEFT JOIN survey_votes sv ON s.id = sv.survey_id
     WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

async function fetchUserVoteForSurvey(surveyId, userId) {
  const [rows] = await pool.execute(
    'SELECT id FROM survey_votes WHERE survey_id = ? AND user_id = ? AND has_voted = TRUE LIMIT 1',
    [surveyId, userId]
  );
  return rows.length > 0;
}

async function fetchUserVotesForSurvey(surveyId, userId) {
  const [rows] = await pool.execute(
    'SELECT option_id FROM survey_votes WHERE survey_id = ? AND user_id = ?',
    [surveyId, userId]
  );
  return rows.map(r => r.option_id);
}

async function fetchUserVotesForSurveys(surveyIds, userId) {
  if (!Array.isArray(surveyIds) || surveyIds.length === 0) return new Map();
  const placeholders = surveyIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT survey_id, option_id FROM survey_votes WHERE user_id = ? AND survey_id IN (${placeholders})`,
    [userId, ...surveyIds]
  );
  const map = new Map();
  for (const sid of surveyIds) map.set(sid, []);
  for (const r of rows) {
    if (!map.has(r.survey_id)) map.set(r.survey_id, []);
    map.get(r.survey_id).push(r.option_id);
  }
  return map;
}

async function fetchSurveyById(id) {
  const [rows] = await pool.execute('SELECT * FROM surveys WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}

async function fetchValidOptionsForSurvey(optionIds, surveyId) {
  const placeholders = optionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT id FROM survey_options WHERE id IN (${placeholders}) AND survey_id = ?`,
    [...optionIds, surveyId]
  );
  return rows;
}

async function insertVotes(connection, surveyId, optionIds, userId, userIp, userAgent) {
  for (const optionId of optionIds) {
    await connection.execute(
      'INSERT INTO survey_votes (survey_id, option_id, user_id, user_ip, user_agent, has_voted) VALUES (?, ?, ?, ?, ?, TRUE)',
      [surveyId, optionId, userId, userIp, userAgent || null]
    );
  }
}

async function createSurveyWithOptions(connection, data) {
  const { question, is_multiple_choice, max_votes_per_user, created_by, expires_at, options } = data;
  const [result] = await connection.execute(
    `INSERT INTO surveys (question, is_multiple_choice, max_votes_per_user, created_by, expires_at) VALUES (?, ?, ?, ?, ?)`,
    [question, is_multiple_choice, max_votes_per_user, created_by, expires_at]
  );
  const surveyId = result.insertId;
  for (let i = 0; i < options.length; i++) {
    await connection.execute(
      'INSERT INTO survey_options (survey_id, option_text, display_order) VALUES (?, ?, ?)',
      [surveyId, options[i], i + 1]
    );
  }
  return surveyId;
}

async function updateSurveyById(id, fields) {
  const updateFields = [];
  const updateValues = [];
  if (fields.question !== undefined) { updateFields.push('question = ?'); updateValues.push(fields.question); }
  if (fields.status !== undefined) { updateFields.push('status = ?'); updateValues.push(fields.status); }
  if (fields.is_multiple_choice !== undefined) { updateFields.push('is_multiple_choice = ?'); updateValues.push(fields.is_multiple_choice); }
  if (fields.max_votes_per_user !== undefined) { updateFields.push('max_votes_per_user = ?'); updateValues.push(fields.max_votes_per_user); }
  if (fields.expires_at !== undefined) { updateFields.push('expires_at = ?'); updateValues.push(fields.expires_at); }
  if (updateFields.length === 0) return 0;
  updateValues.push(id);
  const [result] = await pool.execute(`UPDATE surveys SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
  return result.affectedRows;
}

async function deleteSurveyById(id) {
  const [result] = await pool.execute('DELETE FROM surveys WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  countSurveysByStatus,
  fetchSurveysWithCounts,
  fetchSurveyByIdWithTotalVotes,
  fetchOptionsWithStats,
  fetchOptionsBasic,
  fetchActiveSurveysWithCounts,
  fetchUserVoteForSurvey,
  fetchUserVotesForSurvey,
  fetchUserVotesForSurveys,
  fetchSurveyById,
  fetchValidOptionsForSurvey,
  insertVotes,
  createSurveyWithOptions,
  updateSurveyById,
  deleteSurveyById,
  pool,
};


