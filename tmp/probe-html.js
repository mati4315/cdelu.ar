const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/nadadores-uruguayenses-se-animaron-al-mar-en-punta-del-este/';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
        console.log('Status:', res.status);
        console.log('Length:', res.data.length);
        const og = res.data.match(/property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i);
        console.log('OG:', og ? og[1] : 'NONE');
        // Find any meta image
        const meta = res.data.match(/meta[^>]+image[^>]+content=['"]([^'"]+)['"]/i);
        console.log('Meta any image:', meta ? meta[1] : 'NONE');
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
