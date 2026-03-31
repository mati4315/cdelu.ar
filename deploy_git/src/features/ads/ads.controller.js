"use strict";

const service = require('./ads.service');

async function getActiveAds(request, reply) {
  try {
    const res = await service.listActiveAds(request.query || {});
    return reply.send(res);
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function getAllAds(request, reply) {
  try {
    const res = await service.listAllAds(request.query || {});
    return reply.send(res);
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function getAdById(request, reply) {
  try {
    const row = await service.getAdById(request.params.id);
    if (!row) return reply.code(404).send({ error: 'Anuncio no encontrado' });
    return reply.send({ success: true, data: row });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function createAd(request, reply) {
  try {
    const insertId = await service.createAd(request.body, request.user.id);
    if (!insertId) return reply.code(400).send({ error: 'Datos inválidos' });
    return reply.code(201).send({ success: true, message: 'Anuncio creado exitosamente', data: { id: insertId } });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function updateAd(request, reply) {
  try {
    const ok = await service.updateAd(request.params.id, request.body);
    if (!ok) return reply.code(400).send({ error: 'Sin datos para actualizar' });
    return reply.send({ success: true, message: 'Anuncio actualizado exitosamente' });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function deleteAd(request, reply) {
  try {
    const ok = await service.deleteAd(request.params.id);
    if (!ok) return reply.code(404).send({ error: 'Anuncio no encontrado' });
    return reply.send({ success: true, message: 'Anuncio eliminado exitosamente' });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function registerImpression(request, reply) {
  try {
    await service.registerImpression(request.params.id);
    return reply.send({ success: true, message: 'Impresión registrada' });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function registerClick(request, reply) {
  try {
    await service.registerClick(request.params.id);
    return reply.send({ success: true, message: 'Clic registrado' });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

async function getAdStats(request, reply) {
  try {
    const stats = await service.getStats();
    return reply.send({ success: true, data: stats });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getActiveAds,
  getAllAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  registerImpression,
  registerClick,
  getAdStats,
};


