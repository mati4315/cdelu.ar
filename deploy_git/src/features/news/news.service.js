"use strict";

// Servicio de aplicación para Noticias
// Orquesta reglas de negocio, validaciones y llamadas al repositorio

const repo = require('./news.repository');
const { generateSummary, generateTitle } = require('../../services/aiService');
const { sanitizeBasicHtml } = require('../../utils/sanitizer');

const ALLOWED_SORT_FIELDS = ['titulo', 'created_at', 'likes_count', 'comments_count', 'latest', 'oldest'];
const ALLOWED_ORDERS = ['asc', 'desc'];

function buildOrderByClause(sort, order) {
  if (sort === 'latest') return 'ORDER BY n.created_at DESC';
  if (sort === 'oldest') return 'ORDER BY n.created_at ASC';

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
  let tituloFinal = input.titulo;

  // Si es oficial, podríamos generar un título con IA (opcional)
  if (isOficial && !tituloFinal) {
    try {
      tituloFinal = await generateTitle(input.descripcion);
    } catch (err) {
      // Continuar sin interrumpir si IA falla
    }
  }

  const insertData = {
    titulo: tituloFinal,
    descripcion: sanitizeBasicHtml(input.descripcion),
    image_url: input.image_url ?? null,
    image_thumbnail_url: input.image_thumbnail_url ?? null,
    original_url: input.original_url ?? null,
    is_oficial: isOficial,
    created_by: userId,
    published_at: input.published_at ? new Date(input.published_at) : new Date(),
    diario: input.diario ?? null,
    categoria: input.categoria ?? null,
  };

  const insertId = await repo.insertNews(insertData);
  return await repo.fetchNewsById(insertId);
}

async function updateNews(id, input, currentUser) {
  const existing = await repo.fetchNewsById(id);
  if (!existing) return null;

  await repo.updateNewsById(id, {
    titulo: input.titulo ?? existing.titulo,
    descripcion: input.descripcion ? sanitizeBasicHtml(input.descripcion) : existing.descripcion,
    image_url: input.image_url ?? existing.image_url,
    image_thumbnail_url: input.image_thumbnail_url ?? existing.image_thumbnail_url,
    original_url: input.original_url ?? existing.original_url,
    is_oficial: input.is_oficial ?? existing.is_oficial,
    diario: input.diario ?? existing.diario,
    categoria: input.categoria ?? existing.categoria,
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

async function getCommentsCount(newsId) {
  const count = await repo.getCommentsCountFromFeed(newsId);
  return count;
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
  getCommentsCount,
};


