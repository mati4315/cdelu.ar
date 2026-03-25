const axios = require('axios');

async function scrapeImageFromUrl(url) {
    if (!url) return null;
    try {
        console.log('Scrapeando:', url);
        const res = await axios.get(url, { 
            timeout: 5000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
            } 
        });
        const html = res.data;
        
        // og:image
        const ogMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i) ||
                        html.match(/<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]og:image['"]/i);
        if (ogMatch && ogMatch[1]) console.log('Found og:image:', ogMatch[1]);
        
        // twitter:image
        const twMatch = html.match(/<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"]/i) ||
                        html.match(/<meta[^>]+content=['"]([^'"]+)['"][^>]+name=['"]twitter:image['"]/i);
        if (twMatch && twMatch[1]) console.log('Found twitter:image:', twMatch[1]);
        
        // Link rel image_src
        const srcMatch = html.match(/<link[^>]+rel=['"]image_src['"][^>]+href=['"]([^'"]+)['"]/i);
        if (srcMatch && srcMatch[1]) console.log('Found image_src:', srcMatch[1]);

        return null;
    } catch (err) {
        console.log('Error:', err.message);
        return null;
    }
}

(async () => {
    await scrapeImageFromUrl('https://lacalle.com.ar/el-atletismo-vuelve-al-primer-plano-en-nuestra-ciudad/');
})();
