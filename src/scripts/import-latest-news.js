const Parser = require('rss-parser');
const pool = require('../config/database');
const config = require('../config/default');
const aiService = require('../services/aiService');

const parser = new Parser({
    customFields: {
        item: [
            'content:encoded',
            'description',
            'enclosure'
        ]
    }
});

async function importLatestNews() {
    try {
        console.log('Iniciando importación de noticia más reciente...');
        
        // Obtener el feed RSS
        const feed = await parser.parseURL(config.rss.feedUrl);
        if (!feed.items || feed.items.length === 0) {
            console.log('No se encontraron noticias en el feed');
            return;
        }

        // Obtener índice de noticia desde .env o usar 0 por defecto
        const newsIndex = Number.isInteger(parseInt(process.env.NOTICIA_NUMERO, 10))
            ? parseInt(process.env.NOTICIA_NUMERO, 10)
            : 0;
        const latestNews = feed.items[newsIndex];
        // Validar que exista la noticia en la posición indicada
        if (!latestNews) {
            console.log(`No se encontró noticia en el índice ${newsIndex}`);
            return;
        }
        console.log('Noticia más reciente encontrada:', latestNews.title);

        // Obtener el contenido completo
        const content = latestNews['content:encoded'] || latestNews.content || latestNews.description;
        console.log('Longitud del contenido:', content.length);

        // Extraer la URL de la imagen de portada
        let imageUrl = null;
        // 1) Usar enclosure si está disponible
        if (latestNews.enclosure && latestNews.enclosure.url) {
            imageUrl = latestNews.enclosure.url;
        } else {
            // 2) Buscar la primera etiqueta img en content:encoded o description
            const imgRegex = /<img[^>]+src=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i;
            const htmlToSearch = latestNews['content:encoded'] || latestNews.content || latestNews.description;
            const match = htmlToSearch.match(imgRegex);
            if (match && match[1]) {
                imageUrl = match[1];
            }
        }
        console.log('URL de imagen encontrada:', imageUrl);

        // Verificar si la noticia ya existe en la base de datos antes de generar IA
        const [existingNews] = await pool.query(
            'SELECT id FROM news WHERE original_url = ?',
            [latestNews.link]
        );
        if (existingNews.length > 0) {
            console.log('La noticia ya existe, se ignora.');
            return;
        }

        // Generar título con IA
        console.log('Generando título con IA...');
        const generatedTitle = await aiService.generateTitle(content);
        // Limitar el título a 255 caracteres
        const truncatedTitle = generatedTitle.substring(0, 255);
        console.log('Título generado:', truncatedTitle);

        // Generar resumen de la descripción con IA
        console.log('Generando resumen de la descripción con IA...');
        const summarizedContent = await aiService.generateSummary(content);
        console.log('Resumen generado:', summarizedContent);

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
                truncatedTitle,
                summarizedContent,
                imageUrl,
                latestNews.link,
                new Date(latestNews.pubDate),
                true,
                1 // ID del usuario administrador
            ]
        );

        console.log('Noticia importada exitosamente con ID:', result.insertId);
    } catch (error) {
        console.error('Error al importar noticia:', error);
    } finally {
        // Cerrar la conexión a la base de datos
        await pool.end();
    }
}

// Ejecutar el script
importLatestNews(); 