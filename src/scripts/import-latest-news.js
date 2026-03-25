const Parser = require('rss-parser');
const pool = require('../config/database');
const config = require('../config/default');
const aiService = require('../services/aiService');
const imageExtractor = require('../services/imageExtractor');

const parser = new Parser({
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
 * Importa noticia por índice (usado por el dashboard SSE)
 */
async function importLatestNews() {
    try {
        const newsIndex = Number.isInteger(parseInt(process.env.NOTICIA_NUMERO, 10))
            ? parseInt(process.env.NOTICIA_NUMERO, 10)
            : 0;
            
        console.log(`Buscando noticia en el índice ${newsIndex} del feed...`);
        
        const feed = await parser.parseURL(config.rss.feedUrl);
        if (!feed.items || feed.items.length === 0) {
            console.log('Error: No se encontraron noticias en el feed');
            process.exit(1);
        }

        const latestNews = feed.items[newsIndex];
        if (!latestNews) {
            console.log(`Error: No hay noticia en el índice ${newsIndex}`);
            process.exit(1);
        }

        console.log('Noticia seleccionada:', latestNews.title);

        const [existingNews] = await pool.query('SELECT id FROM news WHERE original_url = ?', [latestNews.link]);
        if (existingNews.length > 0) {
            console.log('Aviso: La noticia ya existe en la base de datos (se omite).');
            return;
        }

        // --- EXTRACCIÓN DE IMAGEN (MEJORADA) ---
        console.log('Extrayendo imagen con estrategias avanzadas...');
        const imageUrl = await imageExtractor.extractImageFromRSSItem(latestNews);
        const thumbUrl = await imageExtractor.extractThumbnailOnly(latestNews);
        
        if (imageUrl) {
            console.log('Portada principal detectada:', imageUrl);
        }
        if (thumbUrl && thumbUrl !== imageUrl) {
            console.log('Miniatura secundaria detectada:', thumbUrl);
        }
        if (!imageUrl && !thumbUrl) {
            console.log('Aviso: No se pudo detectar ninguna imagen (usando valor nulo).');
        }

        // --- PROCESAMIENTO CON IA ---
        const content = latestNews['content:encoded'] || latestNews.content || latestNews.description || "";
        
        console.log('Generando título optimizado...');
        let generatedTitle = latestNews.title;
        try {
            const aiTitle = await aiService.generateTitle(content);
            if (aiTitle) generatedTitle = aiTitle;
        } catch (err) {}

        console.log('Generando resumen automático...');
        let summarizedContent = latestNews.contentSnippet || latestNews.description || "Sin descripción disponible.";
        try {
            const aiSummary = await aiService.generateSummary(content);
            if (aiSummary) summarizedContent = aiSummary;
        } catch (err) {}

        // --- GUARDADO A BASE DE DATOS ---
        const [result] = await pool.query(
            `INSERT INTO news (titulo, descripcion, image_url, image_thumbnail_url, original_url, published_at, is_oficial, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                generatedTitle.substring(0, 255), 
                summarizedContent, 
                imageUrl, 
                thumbUrl, 
                latestNews.link, 
                latestNews.pubDate ? new Date(latestNews.pubDate) : new Date(), 
                true, 
                1
            ]
        );

        console.log('Importación finalizada con éxito. ID:', result.insertId);
    } catch (error) {
        console.error('Error crítico durante la importación:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

importLatestNews(); 