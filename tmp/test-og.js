const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/hay-dos-millones-y-medio-de-personas-trabajando-en-negro-en-la-argentina/';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const og = res.data.match(/property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i);
        console.log('OG:', og ? og[1] : 'NOT FOUND');
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
