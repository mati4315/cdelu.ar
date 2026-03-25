const imageExtractor = require('./src/services/imageExtractor');

async function test() {
    console.log('🧪 Probando extractor modular...\n');
    
    // URL que sabemos que tiene og:image
    const testUrls = [
        'https://lacalle.com.ar/los-pumas-derrotaron-a-irlanda-con-agonico-try-sobre-el-final/',
        'https://elentrerios.com/actualidad/la-muni-continua-reparando-canerias-de-agua-potable.htm'
    ];
    
    for (const url of testUrls) {
        console.log(`URL: ${url}`);
        const image = await imageExtractor.scrapeImageFromUrl(url);
        
        if (image) {
            console.log(`✅ EXTRACCIÓN EXITOSA: \n${image}\n`);
        } else {
            console.log('❌ FALLÓ EXTRACCIÓN\n');
        }
    }
}

test();
