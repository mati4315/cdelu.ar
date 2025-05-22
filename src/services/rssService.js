const Parser = require('rss-parser');
const pool = require('../config/database');

// Crear el parser solo cuando se necesite, no globalmente
function createParser() {
    return new Parser({
        timeout: 30000, // 30 segundos de timeout
        maxRedirects: 3 // Limitar redirecciones
    });
}

/**
 * Importa noticias desde el feed RSS configurado
 * @returns {Promise<Array>} Lista de noticias importadas
 */
async function importNewsFromRSS() {
    const parser = createParser();
    const importedNews = [];
    let connection = null;
    
    try {
        connection = await pool.getConnection();
        const feed = await parser.parseURL(process.env.RSS_FEED_URL);
        
        // Procesar solo los últimos 10 elementos para limitar consumo de memoria
        const recentItems = feed.items.slice(0, 10);
        
        for (const item of recentItems) {
            // Verificar si la noticia ya existe
            const [existingNews] = await connection.query(
                'SELECT id FROM news WHERE original_url = ?',
                [item.link]
            );

            if (existingNews.length === 0) {
                // Insertar nueva noticia
                const [result] = await connection.query(
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
                        (item.content || item.description || '').substring(0, 5000), // Limitar longitud
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
    } finally {
        // Liberar la conexión explícitamente
        if (connection) {
            connection.release();
        }
        // Ayudar al GC a liberar memoria
        parser = null;
    }
}

/**
 * Programa la importación automática de noticias
 * @param {number} intervalMinutes Intervalo en minutos para la importación
 */
function scheduleRSSImport(intervalMinutes = 60) {
    // Intervalo mínimo de 30 minutos para reducir carga
    const interval = Math.max(30, intervalMinutes) * 60 * 1000;
    
    // Usar setTimeout en lugar de setInterval para evitar solapamiento
    const scheduleNextImport = () => {
        setTimeout(async () => {
            try {
                // Verificar si está habilitado antes de cada ejecución
                if (process.env.RSS_ENABLED === 'false') {
                    console.log('Importación RSS deshabilitada por configuración');
                    scheduleNextImport(); // Programar siguiente aunque esté deshabilitado
                    return;
                }
                
                const importedNews = await importNewsFromRSS();
                if (importedNews.length > 0) {
                    console.log(`Importadas ${importedNews.length} nuevas noticias desde RSS`);
                }
                
                // Liberar memoria
                global.gc && global.gc();
            } catch (error) {
                console.error('Error en la importación programada de RSS:', error);
            }
            scheduleNextImport();
        }, interval);
    };
    
    // Iniciar la programación
    scheduleNextImport();
}

module.exports = {
    importNewsFromRSS,
    scheduleRSSImport
}; 