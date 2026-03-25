const imageExtractor = require('./src/services/imageExtractor');
const Parser = require('rss-parser');
const config = require('./src/config/default');

const parser = new Parser();

(async () => {
    try {
        console.log('📡 Analizando el feed de La Calle para buscar portadas y MINIATURAS...\n');
        const feed = await parser.parseURL(config.rss.feedUrl);
        
        const items = feed.items.slice(0, 3); // Solo 3 para no tardar mucho en el raspado
        
        for (const [index, item] of items.entries()) {
            console.log(`📰 Noticia ${index + 1}: ${item.title}`);
            console.log(`🔗 Link: ${item.link}`);
            
            // Portada normal
            const main = await imageExtractor.scrapeImageFromUrl(item.link);
            
            // Miniatura específica
            const thumb = await imageExtractor.extractThumbnailOnly(item);
            
            console.log('✅ EXTRACCIÓN REALIZADA:');
            console.log(`🖼️  Portada (HQ): ${main || 'N/A'}`);
            console.log(`🖼️  Miniatura:   ${thumb || 'N/A'}`);
            
            if (main && thumb && main === thumb) {
                console.log('💡 Tip: No se detectó miniatura separada, se sugiere usar la misma portada.');
            } else if (main && thumb) {
                console.log('💡 Tip: Se encontró una miniatura optimizada.');
            }
            console.log('---------------------------------------------------\n');
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
})();
