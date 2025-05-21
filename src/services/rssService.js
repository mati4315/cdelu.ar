const Parser = require('rss-parser');
const pool = require('../config/database');

const parser = new Parser();

/**
 * Importa noticias desde el feed RSS configurado
 * @returns {Promise<Array>} Lista de noticias importadas
 */
async function importNewsFromRSS() {
    try {
        const feed = await parser.parseURL(process.env.RSS_FEED_URL);
        const importedNews = [];

        for (const item of feed.items) {
            // Verificar si la noticia ya existe
            const [existingNews] = await pool.query(
                'SELECT id FROM news WHERE original_url = ?',
                [item.link]
            );

            if (existingNews.length === 0) {
                // Insertar nueva noticia
                const [result] = await pool.query(
                    `INSERT INTO news (
                        titulo, 
                        descripcion, 
                        image_url, 
                        original_url, 
                        published_at, 
                        is_oficial
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        item.title,
                        item.content || item.description,
                        item.enclosure?.url || null,
                        item.link,
                        new Date(item.pubDate),
                        true
                    ]
                );

                importedNews.push({
                    id: result.insertId,
                    titulo: item.title
                });
            }
        }

        return importedNews;
    } catch (error) {
        console.error('Error al importar noticias desde RSS:', error);
        throw error;
    }
}

/**
 * Programa la importación automática de noticias
 * @param {number} intervalMinutes Intervalo en minutos para la importación
 */
function scheduleRSSImport(intervalMinutes = 60) {
    setInterval(async () => {
        try {
            const importedNews = await importNewsFromRSS();
            if (importedNews.length > 0) {
                console.log(`Importadas ${importedNews.length} nuevas noticias desde RSS`);
            }
        } catch (error) {
            console.error('Error en la importación programada de RSS:', error);
        }
    }, intervalMinutes * 60 * 1000);
}

module.exports = {
    importNewsFromRSS,
    scheduleRSSImport
}; 