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
    let parser = createParser();
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

/**
 * Obtiene las noticias del RSS sin guardarlas (para selección manual)
 */
async function previewRSSNews() {
    const parser = createParser();
    try {
        if (!process.env.RSS_FEED_URL) throw new Error('RSS_FEED_URL no configurado');
        const feed = await parser.parseURL(process.env.RSS_FEED_URL);
        return feed.items.slice(0, 20).map(item => ({
            title: item.title,
            description: (item.content || item.description || '').substring(0, 5000),
            image_url: item.enclosure?.url || '',
            original_url: item.link || '',
            published_at: item.pubDate || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error previewing RSS:', error);
        throw error;
    }
}

/**
 * Importa una noticia específica del feed por su índice emitiendo eventos vía SSE
 */
async function importNewsIndexedStream(index, sendEvent) {
    let parser = createParser();
    let connection = null;
    try {
        sendEvent('log', 'Conectando a la base de datos...');
        connection = await pool.getConnection();
        
        sendEvent('log', `Descargando feed RSS desde ${process.env.RSS_FEED_URL}...`);
        const feed = await parser.parseURL(process.env.RSS_FEED_URL);
        
        if (feed.items.length <= index) {
             sendEvent('error', `El índice ${index} no existe en el feed.`);
             sendEvent('done', 'error_index');
             return;
        }

        const item = feed.items[index];
        sendEvent('log', `Noticia encontrada: "${item.title}"`);
        sendEvent('log', `Verificando si la noticia ya existe...`);

        const [existingNews] = await connection.query(
            'SELECT id FROM news WHERE original_url = ?',
            [item.link]
        );

        if (existingNews.length > 0) {
            sendEvent('log', `La noticia ya existe en la base de datos (ID: ${existingNews[0].id}).`);
            sendEvent('done', 'error_exists');
            return;
        }

        sendEvent('log', `Insertando noticia en la base de datos...`);
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
                (item.content || item.description || '').substring(0, 5000),
                item.enclosure?.url || null,
                item.link,
                new Date(item.pubDate),
                true
            ]
        );

        sendEvent('log', `Noticia insertada exitosamente con ID: ${result.insertId}.`);
        sendEvent('done', 'ok');
    } catch (error) {
        sendEvent('error', error.message);
        sendEvent('done', 'error');
    } finally {
        if (connection) connection.release();
        parser = null;
    }
}

module.exports = {
    importNewsFromRSS,
    scheduleRSSImport,
    previewRSSNews,
    importNewsIndexedStream
}; 