"use strict";

const repo = require('./ads.repository');

async function listActiveAds({ limit = 20, categoria }) {
  const lim = Math.max(1, Math.min(Number(limit) || 20, 50));
  const rows = await repo.fetchActiveAds(lim, categoria);
  return { success: true, data: rows, total: rows.length };
}

async function listAllAds({ page = 1, limit = 10, categoria, activo }) {
  const pageNum = Math.max(1, Number(page) || 1);
  const lim = Math.max(1, Math.min(Number(limit) || 10, 100));
  const offset = (pageNum - 1) * lim;

  let whereClause = '1=1';
  const params = [];
  if (categoria) {
    whereClause += ' AND categoria = ?';
    params.push(categoria);
  }
  if (activo !== undefined && activo !== '') {
    whereClause += ' AND activo = ?';
    params.push(String(activo) === 'true');
  }

  const total = await repo.countAllAds(whereClause, params);
  const rows = await repo.fetchAllAds(whereClause, params, lim, offset);
  return {
    success: true,
    data: rows,
    pagination: { total, page: pageNum, limit: lim, totalPages: Math.ceil(total / lim) },
  };
}

async function getAdById(id) {
  return await repo.fetchAdById(Number(id));
}

async function createAd(input, createdBy) {
  if (!input.titulo || !input.enlace_destino) return null;
  const insertId = await repo.insertAd({ ...input, created_by: createdBy });
  return insertId;
}

async function updateAd(id, updates) {
  return await repo.updateAdById(Number(id), updates);
}

async function deleteAd(id) {
  return await repo.deleteAdById(Number(id));
}

async function registerImpression(id) {
  await repo.incrementImpression(Number(id));
}

async function registerClick(id) {
  await repo.incrementClick(Number(id));
}

async function getStats() {
  return await repo.fetchStats();
}

module.exports = {
  listActiveAds,
  listAllAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  registerImpression,
  registerClick,
  getStats,
};


