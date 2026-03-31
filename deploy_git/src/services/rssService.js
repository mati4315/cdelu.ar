const Parser = require('rss-parser');
const pool = require('../config/database');
const axios = require('axios');
const imageExtractor = require('./imageExtractor');
const { sanitizeBasicHtml } = require('../utils/sanitizer');

// Configuración mejorada del parser
const parser = new Parser({
    timeout: 30000,
    maxRedirects: 3,
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['webfeeds:featuredImage', 'featuredImage'],
            'description',
            'enclosure'
        ]
    }
});

/**
 * Importa noticias desde el feed RSS configurado (Automático)
 */
async function importNewsFromRSS() {
    let connection = null;
    const importedNews = [];
    
    try {
        const feedUrl = process.env.RSS_FEED_URL;
        if (!feedUrl) return [];

        connection = await pool.getConnection();
        const feed = await parser.parseURL(feedUrl);
        const recentItems = feed.items.slice(0, 10);
        
        for (const item of recentItems) {
            const [existingNews] = await connection.query(
                'SELECT id FROM news WHERE original_url = ?',
                [item.link]
            );

            if (existingNews.length === 0) {
                // Usamos el extractor modular
                const imageUrl = await imageExtractor.extractImageFromRSSItem(item);
                
                const [result] = await connection.query(
                    `INSERT INTO news (titulo, descripcion, image_url, original_url, published_at, is_oficial) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        item.title,
                        sanitizeBasicHtml(item.contentEncoded || item.description || item.contentSnippet || '').substring(0, 5000),
                        imageUrl,
                        item.link,
                        item.pubDate ? new Date(item.pubDate) : new Date(),
                        true
                    ]
                );

                importedNews.push({ id: result.insertId, titulo: item.title });
            }
        }
        
        return importedNews;
    } catch (error) {
        console.error('Error al importar noticias desde RSS:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Programa la importación automática de noticias
 */
function scheduleRSSImport(intervalMinutes = 60) {
    const interval = Math.max(30, intervalMinutes) * 60 * 1000;
    const scheduleNextImport = () => {
        setTimeout(async () => {
            try {
                if (process.env.RSS_ENABLED !== 'false') {
                    const imported = await importNewsFromRSS();
                    if (imported.length > 0) console.log(`Importadas ${imported.length} nuevas noticias RSS`);
                }
            } catch (error) {
                console.error('Error en RSS programado:', error);
            }
            scheduleNextImport();
        }, interval);
    };
    scheduleNextImport();
}

/**
 * Obtiene las noticias del RSS sin guardarlas (Previsualización)
 */
async function previewRSSNews() {
    try {
        const feedUrl = process.env.RSS_FEED_URL;
        if (!feedUrl) throw new Error('RSS_FEED_URL no configurado');
        
        const feed = await parser.parseURL(feedUrl);
        const items = feed.items.slice(0, 20);
        
        const results = [];
        for (const item of items) {
            results.push({
                title: item.title,
                description: sanitizeBasicHtml(item.contentEncoded || item.description || item.contentSnippet || '').substring(0, 5000),
                image_url: await imageExtractor.extractImageFromRSSItem(item),
                image_thumbnail_url: await imageExtractor.extractThumbnailOnly(item),
                original_url: item.link || '',
                published_at: item.pubDate || new Date().toISOString()
            });
        }
        
        return results;
    } catch (error) {
        console.error('Error en previsualización RSS:', error);
        throw error;
    }
}

/**
 * Función especial para streaming incremental
 */
async function importNewsIndexedStream(res, noticiaIndex) {
    let connection = null;
    const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
        const feedUrl = process.env.RSS_FEED_URL;
        if (!feedUrl) throw new Error('RSS_FEED_URL no configurado');

        const feed = await parser.parseURL(feedUrl);
        const item = feed.items[noticiaIndex];

        if (!item) {
            sendEvent('error', 'Noticia no encontrada en el feed');
            return;
        }

        connection = await pool.getConnection();
        const [existingNews] = await connection.query('SELECT id FROM news WHERE original_url = ?', [item.link]);

        if (existingNews.length > 0) {
            sendEvent('log', 'La noticia ya existe en la base de datos');
            sendEvent('done', 'exists');
            return;
        }

        sendEvent('log', `Procesando: ${item.title}`);
        
        // Extracción de imagen con el nuevo extractor modular
        const imageUrl = await imageExtractor.extractImageFromRSSItem(item);
        
        if (imageUrl) {
            sendEvent('log', 'Imagen portada encontrada con éxito');
        } else {
            sendEvent('log', 'No se detectó imagen de portada (usando predeterminada)');
        }

        const [result] = await connection.query(
            `INSERT INTO news (titulo, descripcion, image_url, original_url, published_at, is_oficial) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                item.title,
                sanitizeBasicHtml(item.contentEncoded || item.description || item.contentSnippet || '').substring(0, 5000),
                imageUrl,
                item.link,
                item.pubDate ? new Date(item.pubDate) : new Date(),
                true
            ]
        );

        sendEvent('log', `Importada con éxito (ID: ${result.insertId})`);
        sendEvent('done', 'ok');
    } catch (error) {
        sendEvent('error', error.message);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    importNewsFromRSS,
    scheduleRSSImport,
    previewRSSNews,
    importNewsIndexedStream,
    extractImage: imageExtractor.extractImageFromRSSItem // Mantenemos compatibilidad si se usaba internamente
};