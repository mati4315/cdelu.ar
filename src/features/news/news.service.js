"use strict";

// Servicio de aplicación para Noticias
// Orquesta reglas de negocio, validaciones y llamadas al repositorio

const repo = require('./news.repository');
const { generateSummary, generateTitle } = require('../../services/aiService');

const ALLOWED_SORT_FIELDS = ['titulo', 'created_at', 'likes_count', 'comments_count'];
const ALLOWED_ORDERS = ['asc', 'desc'];

function buildOrderByClause(sort, order) {
  const sortField = ALLOWED_SORT_FIELDS.includes(sort) ? sort : 'created_at';
  const sortOrder = ALLOWED_ORDERS.includes(order) ? order : 'desc';

  if (sortField === 'titulo') return `ORDER BY n.titulo ${sortOrder.toUpperCase()}`;
  if (sortField === 'created_at') return `ORDER BY n.created_at ${sortOrder.toUpperCase()}`;
  if (sortField === 'likes_count') return `ORDER BY likes_count ${sortOrder.toUpperCase()}`;
  if (sortField === 'comments_count') return `ORDER BY comments_count ${sortOrder.toUpperCase()}`;
  return 'ORDER BY n.created_at DESC';
}

async function listNews(params) {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  const sort = params.sort || 'created_at';
  const order = params.order || 'desc';
  const offset = (page - 1) * limit;

  const orderBy = buildOrderByClause(sort, order);
  const data = await repo.fetchNewsList(limit, offset, orderBy);
  const total = await repo.fetchNewsTotalCount();
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getNewsById(id) {
  return await repo.fetchNewsById(id);
}

async function createNews(input, userId) {
  const isOficial = Boolean(input.is_oficial);
  let resumen = null;
  let tituloFinal = input.titulo;

  if (isOficial) {
    try {
      resumen = await generateSummary(input.descripcion);
      tituloFinal = await generateTitle(input.descripcion);
    } catch (err) {
      // Continuar sin interrumpir creación si IA falla
    }
  }

  const insertId = await repo.insertNews({
    titulo: tituloFinal,
    descripcion: input.descripcion,
    resumen,
    image_url: input.image_url ?? null,
    original_url: input.original_url ?? null,
    is_oficial: isOficial,
    created_by: userId,
  });

  return await repo.fetchNewsById(insertId);
}

async function updateNews(id, input, currentUser) {
  const existing = await repo.fetchNewsById(id);
  if (!existing) return null;

  let resumen = existing.resumen;
  if (input.is_oficial && input.descripcion && input.descripcion !== existing.descripcion) {
    try {
      resumen = await generateSummary(input.descripcion);
    } catch (err) {
      // Mantener resumen existente si IA falla
    }
  }

  await repo.updateNewsById(id, {
    titulo: input.titulo ?? existing.titulo,
    descripcion: input.descripcion ?? existing.descripcion,
    resumen,
    image_url: input.image_url ?? existing.image_url,
    original_url: input.original_url ?? existing.original_url,
    is_oficial: input.is_oficial ?? existing.is_oficial,
  });

  return await repo.fetchNewsById(id);
}

async function deleteNews(id) {
  const affected = await repo.deleteNewsById(id);
  return affected > 0;
}

async function addLike(newsId, userId) {
  const exists = await repo.existsLike(userId, newsId);
  if (exists) return false;
  await repo.createLike(userId, newsId);
  return true;
}

async function removeLike(newsId, userId) {
  const affected = await repo.deleteLike(userId, newsId);
  return affected > 0;
}

async function listComments(newsId) {
  return await repo.fetchComments(newsId);
}

async function createComment(newsId, userId, content) {
  const insertId = await repo.createComment(userId, newsId, content);
  return insertId;
}

module.exports = {
  listNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  addLike,
  removeLike,
  listComments,
  createComment,
};


