const axios = require('axios');

/**
 * Valida si una URL de imagen es válida
 */
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:')) return false;
    if (url.includes('pixel') || url.includes('tracker') || url.includes('/1x1.')) return false;
    return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

/**
 * Normaliza una URL
 */
function normalizeUrl(url, baseUrl = '') {
    if (!url) return null;
    let finalUrl = url.trim();
    if (finalUrl.startsWith('//')) {
        finalUrl = 'https:' + finalUrl;
    } else if (finalUrl.startsWith('/')) {
        if (!baseUrl) return null;
        try {
            const origin = new URL(baseUrl).origin;
            finalUrl = origin + finalUrl;
        } catch (e) { return null; }
    }
    return finalUrl;
}

/**
 * Intenta obtener la imagen de portada desde la URL del artículo (Scraping Avanzado)
 */
async function scrapeImageFromUrl(url) {
    if (!url) return null;
    try {
        const res = await axios.get(url, { 
            timeout: 8000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            } 
        });
        const html = res.data;
        let main = null;

        // 1) ESTRATEGIA JSON-LD (Detección profunda)
        try {
            const jsonLdData = html.match(/<script[^>]+type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi);
            if (jsonLdData) {
                for (const script of jsonLdData) {
                    try {
                        const jsonStr = script.replace(/<script[^>]+>/i, '').replace(/<\/script>/i, '').trim();
                        const json = JSON.parse(jsonStr);
                        const findImg = (obj) => {
                            if (!obj) return null;
                            if (typeof obj === 'string' && isValidImageUrl(obj)) return obj;
                            if (obj.url && isValidImageUrl(obj.url)) return obj.url;
                            if (obj.image) return findImg(obj.image);
                            if (Array.isArray(obj)) {
                                for(const i of obj) {
                                    const r = findImg(i);
                                    if(r) return r;
                                }
                            }
                            return null;
                        };
                        const found = findImg(json);
                        if (found) main = normalizeUrl(found, url);
                        if (main) break;
                    } catch(e) {}
                }
            }
        } catch(e) {}

        // 2) ESTRATEGIA OPENGRAPH Y TWITTER (Meta Tags con Regex Robusta)
        if (!main) {
            const ogRegex = /<meta[^>]+(?:property|name)=['"](?:og:image|twitter:image|image_src)['"][^>]+content=['"]([^'"]+)['"]/i;
            const ogAltRegex = /<meta[^>]+content=['"]([^'"]+)['"][^>]+(?:property|name)=['"](?:og:image|twitter:image|image_src)['"]/i;
            
            const match = html.match(ogRegex) || html.match(ogAltRegex);
            if (match && match[1] && isValidImageUrl(match[1])) {
                main = normalizeUrl(match[1], url);
            }
        }

        // 3) ESTRATEGIA LAZY LOAD (data-src, srcset...) en el cuerpo del artículo
        if (!main) {
            const articleMatch = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);
            const searchScope = articleMatch ? articleMatch[2] : html;
            
            // Buscar imágenes con lazy load
            const imgMatch = searchScope.match(/<img[^>]+(?:data-src|data-lazy-src|data-orig-file|src)=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i);
            if (imgMatch && imgMatch[1] && isValidImageUrl(imgMatch[1])) {
                main = normalizeUrl(imgMatch[1], url);
            }
        }

        return main;
    } catch (err) {
        return null;
    }
}

/**
 * Función principal para extraer la mejor imagen para el sistema (Usado por RSS Service y Scripts)
 */
async function extractImageFromRSSItem(item) {
    if (!item) return null;

    // 1) RSS: media:content / media:thumbnail / enclosure
    const mediaThumb = item.mediaThumbnail || item.mediaContent;
    if (mediaObj = mediaThumb) {
        const url = Array.isArray(mediaObj) ? (mediaObj[0].url || (mediaObj[0].$ ? mediaObj[0].$.url : null)) : (mediaObj.url || (mediaObj.$ ? mediaObj.$.url : mediaObj));
        if (isValidImageUrl(url)) return normalizeUrl(url);
    }

    if (item.enclosure && item.enclosure.url && isValidImageUrl(item.enclosure.url)) {
        return normalizeUrl(item.enclosure.url);
    }

    // 2) HTML del item (Búsqueda inicial)
    const contentHtml = item.contentEncoded || item.content || item.description || '';
    const imgMatch = contentHtml.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i);
    if (imgMatch && imgMatch[1] && isValidImageUrl(imgMatch[1])) {
        return normalizeUrl(imgMatch[1]);
    }

    // 3) Scraping Avanzado de la URL original
    if (item.link) {
        return await scrapeImageFromUrl(item.link);
    }

    return null;
}

module.exports = {
    isValidImageUrl,
    normalizeUrl,
    scrapeImageFromUrl,
    extractImageFromRSSItem,
    extractThumbnailOnly: async () => null // Desactivado por petición del usuario
};
