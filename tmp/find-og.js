const axios = require('axios');
(async () => {
    const res = await axios.get('https://lacalle.com.ar/nadadores-uruguayenses-se-animaron-al-mar-en-punta-del-este/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const idx = res.data.indexOf('og:image');
    console.log('INDEX:', idx);
    if (idx !== -1) {
        console.log('CHARS:', res.data.substring(idx - 200, idx + 200));
    }
})();
