const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/uruguayenses-se-animaron-al-mar-en-punta-del-este/';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('Status:', res.status);
        console.log('Length:', res.data.length);
        // Find og:image
        const og = res.data.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i);
        console.log('OG Image:', og ? og[1] : 'NONE');
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
