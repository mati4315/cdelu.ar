const axios = require('axios');

function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:')) return false;
    if (url.includes('pixel') || url.includes('tracker') || url.includes('/1x1.')) return false;
    return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

function normalizeUrl(url, baseUrl = '') {
    if (!url) return null;
    let finalUrl = url.trim();
    if (finalUrl.startsWith('//')) {
        finalUrl = 'https:' + finalUrl;
    } else if (finalUrl.startsWith('/')) {
        if (!baseUrl) return null;
        const origin = new URL(baseUrl).origin;
        finalUrl = origin + finalUrl;
    }
    return finalUrl;
}

async function scrapeImageFromUrl(url) {
    if (!url) return null;
    try {
        console.log('Scrapeando:', url);
        const res = await axios.get(url, { 
            timeout: 7000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
            } 
        });
        const html = res.data;
        
        // JSON-LD
        try {
            const jsonLdMatches = html.match(/<script[^>]+type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi);
            if (jsonLdMatches) {
                for (const match of jsonLdMatches) {
                    try {
                        const content = match.replace(/<script[^>]+>/i, '').replace(/<\/script>/i, '');
                        const json = JSON.parse(content);
                        const findImage = (obj) => {
                            if (!obj) return null;
                            if (typeof obj === 'string' && isValidImageUrl(obj)) return obj;
                            if (obj.url && isValidImageUrl(obj.url)) return obj.url;
                            if (obj.image) return findImage(obj.image);
                            return null;
                        };
                        const img = findImage(json);
                        if (img) {
                             console.log('Encontrada en JSON-LD:', img);
                             return normalizeUrl(img, url);
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // Meta tags
        const metaRegexes = [
            /<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i,
            /<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]og:image['"]/i,
            /<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"]/i
        ];
        for (const regex of metaRegexes) {
            const match = html.match(regex);
            if (match && match[1] && isValidImageUrl(match[1])) {
                 console.log('Encontrada en Meta:', match[1]);
                 return normalizeUrl(match[1], url);
            }
        }
        
        return null;
    } catch (err) {
        console.log('Error:', err.message);
        return null;
    }
}

(async () => {
    const res = await scrapeImageFromUrl('https://lacalle.com.ar/nadadores-uruguayenses-se-animaron-al-mar-en-punta-del-este/');
    console.log('RESULTADO FINAL:', res);
})();
