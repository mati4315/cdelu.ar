const rssService = require('../src/services/rssService');
const config = require('../src/config/default');
const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

(async () => {
    try {
        console.log('📡 Fetching feed:', config.rss.feedUrl);
        const feed = await parser.parseURL(config.rss.feedUrl);
        
        // Buscamos la primera noticia que responda con 200 (evitar las que dan 404 en el feed)
        let targetItem = null;
        console.log('🔍 Validando artículos del feed...');
        for (const item of feed.items.slice(0, 5)) {
            try {
                const res = await axios.head(item.link, { timeout: 3000 });
                if (res.status === 200) {
                    targetItem = item;
                    break;
                }
            } catch (e) {
                console.log(`❌ ${item.title.substring(0,30)}... [${e.response ? e.response.status : 'ERR'}]`);
            }
        }

        if (!targetItem) {
            console.log('⚠️ No se encontró ninguna noticia con URL válida en el feed actual.');
            return;
        }

        console.log('\n--- 📰 EXTRACCIÓN DE PRUEBA ---');
        console.log('Título:', targetItem.title);
        console.log('Link:', targetItem.link);
        
        // Usamos el servicio mejorado
        const imageUrl = await rssService.extractNewsImage(targetItem);
        
        console.log('\n✅ RESULTADO:');
        if (imageUrl) {
            console.log('🖼️  Imagen encontrada:', imageUrl);
            if (imageUrl.includes('wp-content')) console.log('💡 Origen detectado: WordPress Media');
            if (imageUrl.includes('og:image') || imageUrl.includes('twitter')) console.log('💡 Origen detectado: Meta Tags');
        } else {
            console.log('❌ No se pudo encontrar ninguna imagen válida.');
        }
        console.log('-------------------------------\n');

    } catch (error) {
        console.error('Error fatal:', error.message);
    }
})();
