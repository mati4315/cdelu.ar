const axios = require('axios');
const url = 'https://lacalle.com.ar/nadadores-uruguayenses-se-animaron-al-mar-en-punta-del-este/';
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:')) return false;
    if (url.includes('pixel') || url.includes('tracker') || url.includes('/1x1.')) return false;
    return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

(async () => {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = res.data;
    const metaRegexes = [
        /<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i,
        /<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]og:image['"]/i
    ];
    for (const regex of metaRegexes) {
        const match = html.match(regex);
        if (match) console.log('MATCH:', match[1]);
    }
})();
