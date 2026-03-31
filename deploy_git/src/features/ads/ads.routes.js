"use strict";

const ctrl = require('./ads.controller');
const { authenticate, authorize } = require('../../middlewares/auth');

async function adsRoutes(fastify) {
  // GET activos (público)
  fastify.get('/api/v1/ads/active', {}, ctrl.getActiveAds);

  // Admin
  fastify.get('/api/v1/ads', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.getAllAds);
  fastify.get('/api/v1/ads/:id', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.getAdById);
  fastify.post('/api/v1/ads', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.createAd);
  fastify.put('/api/v1/ads/:id', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.updateAd);
  fastify.delete('/api/v1/ads/:id', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.deleteAd);

  // Eventos (público)
  fastify.post('/api/v1/ads/:id/impression', {}, ctrl.registerImpression);
  fastify.post('/api/v1/ads/:id/click', {}, ctrl.registerClick);

  // Stats admin
  fastify.get('/api/v1/ads/stats', { onRequest: [authenticate, authorize(['administrador'])] }, ctrl.getAdStats);
}

module.exports = adsRoutes;


