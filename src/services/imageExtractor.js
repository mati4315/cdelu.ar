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
 * Intenta obtener la imagen de portada y de miniatura desde la URL del artículo (Scraping Avanzado)
 */
async function scrapeImagesFromUrl(url) {
    if (!url) return { main: null, thumb: null };
    try {
        const res = await axios.get(url, { 
            timeout: 7000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            } 
        });
        const html = res.data;
        let main = null;
        let thumb = null;

        // 1) ESTRATEGIA JSON-LD (La más moderna y fiable)
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
                            if (Array.isArray(obj)) {
                                for (const item of obj) {
                                    const found = findImage(item);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        const img = findImage(json);
                        if (img) main = normalizeUrl(img, url);
                        if (main) break; 
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // 2) ESTRATEGIA OPENGRAPH Y TWITTER (Meta Tags)
        if (!main) {
            const metaRegexes = [
                /<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i,
                /<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]og:image['"]/i,
                /<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"]/i,
                /<meta[^>]+content=['"]([^'"]+)['"][^>]+name=['"]twitter:image['"]/i,
                /<meta[^>]+itemprop=['"]image['"][^>]+content=['"]([^'"]+)['"]/i
            ];
            for (const regex of metaRegexes) {
                const match = html.match(regex);
                if (match && match[1] && isValidImageUrl(match[1])) {
                    main = normalizeUrl(match[1], url);
                    break;
                }
            }
        }

        // 3) ESTRATEGIA MINIATURA (image_src o patrones WP)
        const thumbMatch = html.match(/<link[^>]+rel=['"]image_src['"][^>]+href=['"]([^'"]+)['"]/i);
        if (thumbMatch) thumb = normalizeUrl(thumbMatch[1], url);

        if (!thumb) {
            const wpThumbMatch = html.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+(?:-150x150|-300x300|thumb|miniatura)\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i);
            if (wpThumbMatch) thumb = normalizeUrl(wpThumbMatch[1], url);
        }

        // 4) SCOPE ARTICLE (Si nada de lo anterior funcionó para main)
        if (!main) {
            const articleMatch = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);
            const searchScope = articleMatch ? articleMatch[2] : html;
            const bodyImgMatch = searchScope.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i);
            if (bodyImgMatch) main = normalizeUrl(bodyImgMatch[1], url);
        }

        // 5) PREDICCIÓN DE MINIATURA (Si tenemos main pero no thumb)
        if (main && !thumb && main.includes('/uploads/')) {
            const parts = main.split('.');
            const ext = parts.pop();
            const predicted = parts.join('.') + `-150x150.${ext}`;
            thumb = predicted;
        }

        return { main, thumb: thumb || main };
    } catch (err) {
        return { main: null, thumb: null };
    }
}

/**
 * Función principal para extraer la mejor imagen para el sistema
 */
async function extractImageFromRSSItem(item) {
    if (!item) return null;

    // 1) RSS: media:content / media:thumbnail / enclosure
    const mediaThumb = item.mediaThumbnail || item.mediaContent || item.featuredImage;
    if (mediaThumb) {
        const url = Array.isArray(mediaThumb) ? (mediaThumb[0].url || (mediaThumb[0].$ ? mediaThumb[0].$.url : null)) : (mediaThumb.url || (mediaThumb.$ ? mediaThumb.$.url : mediaThumb));
        if (isValidImageUrl(url)) return normalizeUrl(url);
    }

    if (item.enclosure && item.enclosure.url) {
        if (isValidImageUrl(item.enclosure.url)) return normalizeUrl(item.enclosure.url);
    }

    // 2) HTML del item (content o description)
    const htmlToSearch = item.contentEncoded || item.content || item.description || '';
    const imgMatch = htmlToSearch.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+\.(?:png|jpe?g|gif|webp)(?:\?[^'"]*)?)['"]/i);
    if (imgMatch && imgMatch[1] && isValidImageUrl(imgMatch[1])) {
        return normalizeUrl(imgMatch[1]);
    }

    // 3) Scraping Avanzado de la URL original
    if (item.link) {
        const { main } = await scrapeImagesFromUrl(item.link);
        return main;
    }

    return null;
}

/**
 * Específicamente para obtener solo el enlace de la miniatura
 */
async function extractThumbnailOnly(item) {
    if (!item) return null;
    
    // 1) RSS Priority
    if (item.mediaThumbnail) {
        const val = item.mediaThumbnail;
        const url = Array.isArray(val) ? (val[0].url || (val[0].$ ? val[0].$.url : null)) : (val.url || (val.$ ? val.$.url : val));
        if (isValidImageUrl(url)) return normalizeUrl(url);
    }

    // 2) Scraping
    if (item.link) {
        const { thumb } = await scrapeImagesFromUrl(item.link);
        return thumb;
    }

    return null;
}

module.exports = {
    isValidImageUrl,
    normalizeUrl,
    scrapeImageFromUrl: async (url) => (await scrapeImagesFromUrl(url)).main,
    scrapeImages: scrapeImagesFromUrl,
    extractImageFromRSSItem,
    extractThumbnailOnly
};
