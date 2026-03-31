const config = require('../../config/default');
const { fetch } = require('undici');

/**
 * Rutas de Facebook Live
 * GET /api/v1/facebook/live-status
 */
module.exports = async function (fastify) {
  const graphVersion = (config.facebook && config.facebook.graphVersion) || 'v18.0';
  const pageId = (config.facebook && config.facebook.pageId) || process.env.FB_PAGE_ID || '';
  const pageToken = (config.facebook && config.facebook.pageToken) || process.env.FB_PAGE_TOKEN || '';
  const cacheTtlSeconds = (config.facebook && config.facebook.cacheTtlSeconds) || 30;

  let cached = {
    at: 0,
    data: null,
  };

  fastify.get('/api/v1/facebook/live-status', {
    schema: {
      tags: ['Facebook Live'],
      summary: 'Estado del live de Facebook',
      description: 'Devuelve si hay un live activo y datos básicos para embeber o reproducir',
      response: {
        200: {
          description: 'Estado del live',
          type: 'object',
          properties: {
            isLive: { type: 'boolean' },
            videoId: { type: 'string' },
            embedUrl: { type: 'string' },
            hlsUrl: { type: 'string' },
            title: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Soporte de modo mock por querystring o config para desarrollo sin credenciales
      const { mock, permalink, hls } = request.query || {};
      const useMock = (mock === 'true') || (config.facebook && config.facebook.mockEnabled);
      const mockPermalink = (permalink && String(permalink)) || (config.facebook && config.facebook.mockPermalink) || '';
      const mockTitle = (config.facebook && config.facebook.mockTitle) || 'Transmisión en vivo (simulada)';
      const mockHlsUrl = (hls && String(hls)) || (config.facebook && config.facebook.mockHlsUrl) || '';
      const mockStartedAt = (config.facebook && config.facebook.mockStartedAt) || new Date().toISOString();

      // El modo mock tiene prioridad y evita retornar desde cache previo
      if (useMock && mockPermalink) {
        const embedUrlMock = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(mockPermalink)}&show_text=false`;
        return {
          isLive: true,
          videoId: 'mock-video-id',
          embedUrl: embedUrlMock,
          hlsUrl: mockHlsUrl || undefined,
          title: mockTitle,
          startedAt: mockStartedAt
        };
      }

      // Cache simple en memoria (solo para modo real)
      const now = Date.now();
      if (cached.data && (now - cached.at) < cacheTtlSeconds * 1000) {
        return cached.data;
      }

      if (!pageId || !pageToken) {
        const empty = { isLive: false };
        cached = { at: now, data: empty };
        return empty;
      }

      const fields = [
        'id',
        'title',
        'creation_time',
        'start_time',
        'permalink_url',
        'embed_html'
      ].join(',');

      const url = `https://graph.facebook.com/${graphVersion}/${pageId}/live_videos?broadcast_status=[LIVE]&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(pageToken)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const empty = { isLive: false };
        cached = { at: now, data: empty };
        return empty;
      }

      const data = await res.json();
      const live = Array.isArray(data && data.data) && data.data.length > 0 ? data.data[0] : null;

      if (!live) {
        const empty = { isLive: false };
        cached = { at: now, data: empty };
        return empty;
      }

      const livePermalink = live.permalink_url;
      const embedUrl = livePermalink
        ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(livePermalink)}&show_text=false`
        : undefined;

      const response = {
        isLive: true,
        videoId: live.id,
        embedUrl,
        hlsUrl: undefined, // opcional si cuentas con restream propio
        title: live.title,
        startedAt: live.start_time || live.creation_time || undefined,
      };

      cached = { at: now, data: response };
      return response;
    } catch (err) {
      request.log.error({ err }, 'Error consultando Facebook Graph API');
      const empty = { isLive: false };
      cached = { at: Date.now(), data: empty };
      return empty;
    }
  });
};


