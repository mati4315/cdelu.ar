const Parser = require('rss-parser');
const pool = require('../config/database');
const config = require('../config/default');

const parser = new Parser({
    customFields: {
        item: [
            'content:encoded',
            'description',
            'enclosure'
        ]
    }
});

/**
 * Limpia y formatea el contenido HTML para obtener texto plano
 * @param {string} htmlContent Contenido HTML a limpiar
 * @returns {string} Texto limpio
 */
function cleanHtmlContent(htmlContent) {
    if (!htmlContent) return '';
    
    // Remover etiquetas HTML
    let cleanText = htmlContent.replace(/<[^>]*>/g, '');
    
    // Remover entidades HTML
    cleanText = cleanText.replace(/&nbsp;/g, ' ');
    cleanText = cleanText.replace(/&amp;/g, '&');
    cleanText = cleanText.replace(/&lt;/g, '<');
    cleanText = cleanText.replace(/&gt;/g, '>');
    cleanText = cleanText.replace(/&quot;/g, '"');
    cleanText = cleanText.replace(/&#39;/g, "'");
    
    // Limpiar espacios extra y saltos de línea
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
}

/**
 * Genera un título simple basado en el contenido
 * @param {string} content Contenido de la noticia
 * @returns {string} Título generado
 */
function generateSimpleTitle(content) {
    // Tomar las primeras 100 caracteres y crear un título
    const cleanContent = cleanHtmlContent(content);
    let title = cleanContent.substring(0, 100);
    
    // Buscar el final de la primera oración
    const sentenceEnd = title.search(/[.!?]/);
    if (sentenceEnd > 30) { // Si hay una oración completa
        title = title.substring(0, sentenceEnd + 1);
    }
    
    // Limpiar el título
    title = title.replace(/[.!?]+$/, ''); // Remover puntuación final
    title = title.replace(/^["']|["']$/g, ''); // Remover comillas
    title = title.replace(/\s+/g, ' ').trim(); // Limpiar espacios
    
    // Limitar a 255 caracteres
    if (title.length > 255) {
        title = title.substring(0, 252) + '...';
    }
    
    return title;
}

/**
 * Genera un resumen simple basado en el contenido
 * @param {string} content Contenido de la noticia
 * @returns {string} Resumen generado
 */
function generateSimpleSummary(content) {
    const cleanContent = cleanHtmlContent(content);
    
    // Tomar los primeros 300 caracteres como resumen
    let summary = cleanContent.substring(0, 300);
    
    // Buscar el final de la última oración completa
    const lastSentenceEnd = summary.lastIndexOf('.');
    if (lastSentenceEnd > 200) {
        summary = summary.substring(0, lastSentenceEnd + 1);
    }
    
    // Si no hay punto, buscar otros signos de puntuación
    if (!summary.includes('.')) {
        const lastPunctuation = summary.search(/[!?]/);
        if (lastPunctuation > 200) {
            summary = summary.substring(0, lastPunctuation + 1);
        }
    }
    
    // Limpiar el resumen
    summary = summary.replace(/\s+/g, ' ').trim();
    
    // Limitar a 500 caracteres
    if (summary.length > 500) {
        summary = summary.substring(0, 497) + '...';
    }
    
    return summary;
}

/**
 * Extrae la URL de la imagen de la noticia
 * @param {Object} newsItem Item de noticia del RSS
 * @returns {string|null} URL de la imagen o null
 */
function extractImageUrl(newsItem) {
    // 1) Usar enclosure si está disponible
    if (newsItem.enclosure && newsItem.enclosure.url) {
        return newsItem.enclosure.url;
    }
    
    // 2) Buscar la primera etiqueta img en content:encoded o description
    const imgRegex = /<img[^>]+src=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i;
    const htmlToSearch = newsItem['content:encoded'] || newsItem.content || newsItem.description;
    const match = htmlToSearch.match(imgRegex);
    
    return match ? match[1] : null;
}

async function importNewsSimple() {
    try {
        console.log('Iniciando importación de noticias sin IA...');
        
        // Obtener el feed RSS
        const feed = await parser.parseURL(config.rss.feedUrl);
        if (!feed.items || feed.items.length === 0) {
            console.log('No se encontraron noticias en el feed');
            return;
        }

        console.log(`Total de noticias disponibles en el feed: ${feed.items.length}`);
        
        // Obtener índice de inicio desde .env o usar 0 por defecto
        const startIndex = Number.isInteger(parseInt(process.env.NOTICIA_INICIO, 10))
            ? parseInt(process.env.NOTICIA_INICIO, 10)
            : 0;
        
        // Procesar 2 noticias
        const newsToProcess = 2;
        let processedCount = 0;
        
        for (let i = 0; i < newsToProcess && (startIndex + i) < feed.items.length; i++) {
            const newsIndex = startIndex + i;
            const newsItem = feed.items[newsIndex];
            
            console.log(`\n--- Procesando noticia ${i + 1}/${newsToProcess} (índice ${newsIndex}) ---`);
            console.log('Título original:', newsItem.title);
            
            // Verificar si la noticia ya existe en la base de datos
            const [existingNews] = await pool.query(
                'SELECT id FROM news WHERE original_url = ?',
                [newsItem.link]
            );
            
            if (existingNews.length > 0) {
                console.log('La noticia ya existe, se ignora.');
                continue;
            }
            
            // Obtener el contenido completo
            const content = newsItem['content:encoded'] || newsItem.content || newsItem.description;
            console.log('Longitud del contenido:', content.length);
            
            // Generar título simple sin IA
            const generatedTitle = generateSimpleTitle(content);
            console.log('Título generado:', generatedTitle);
            
            // Generar resumen simple sin IA
            const generatedSummary = generateSimpleSummary(content);
            console.log('Resumen generado:', generatedSummary.substring(0, 100) + '...');
            
            // Extraer URL de imagen
            const imageUrl = extractImageUrl(newsItem);
            console.log('URL de imagen:', imageUrl);
            
            // Insertar la nueva noticia
            const [result] = await pool.query(
                `INSERT INTO news (
                    titulo, 
                    descripcion, 
                    image_url, 
                    original_url, 
                    published_at, 
                    is_oficial,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    generatedTitle,
                    generatedSummary,
                    imageUrl,
                    newsItem.link,
                    new Date(newsItem.pubDate),
                    true,
                    1 // ID del usuario administrador
                ]
            );
            
            console.log('Noticia importada exitosamente con ID:', result.insertId);
            processedCount++;
        }
        
        console.log(`\n=== Resumen de importación ===`);
        console.log(`Noticias procesadas: ${processedCount}/${newsToProcess}`);
        console.log(`Próximo índice de inicio: ${startIndex + newsToProcess}`);
        console.log('Para procesar las siguientes 2 noticias, ejecuta:');
        console.log(`NOTICIA_INICIO=${startIndex + newsToProcess} npm run import-news-simple`);
        
    } catch (error) {
        console.error('Error al importar noticias:', error);
    } finally {
        // Cerrar la conexión a la base de datos
        await pool.end();
    }
}

// Ejecutar el script
importNewsSimple(); 